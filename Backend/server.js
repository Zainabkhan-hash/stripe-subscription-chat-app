require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const http = require('http');
const socketIo = require('socket.io');

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',  
  'https://stripe-subscription-chat-app-production.up.railway.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== Database Connection ==========
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB error:", err));

// ========== Schemas ==========
const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  stripeCustomerId: String,
  subscriptionStatus: { type: String, default: 'free' },
  subscriptionId: String
});

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  userEmail: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

// ========== Auth Middleware ==========
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ========== Auth Routes ==========

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      subscriptionStatus: 'free'
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, status: user.subscriptionStatus },
      process.env.JWT_SECRET
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, subscriptionStatus: user.subscriptionStatus }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, email: user.email, status: user.subscriptionStatus },
      process.env.JWT_SECRET
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, subscriptionStatus: user.subscriptionStatus }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    res.json({
      user: { id: user._id, name: user.name, email: user.email, subscriptionStatus: user.subscriptionStatus }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ========== Stripe Routes ==========

// Create Checkout Session
app.post('/api/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user._id.toString() }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRO_PRICE_ID,
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/dashboard?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard?canceled=true`,
      metadata: { userId: user._id.toString() }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel Subscription
app.post('/api/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.subscriptionId) {
      await stripe.subscriptions.update(user.subscriptionId, { cancel_at_period_end: true });
    }
    res.json({ message: 'Subscription will be cancelled at period end' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ========== Message Routes ==========

// Get messages (last 50)
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
    res.json(messages.reverse());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send message (Pro users only)
app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.subscriptionStatus !== 'pro') {
      return res.status(403).json({ error: 'Pro subscription required to send messages' });
    }

    const message = new Message({
      userId: user._id,
      userName: user.name || user.email,
      userEmail: user.email,
      message: req.body.message
    });

    await message.save();

    const io = req.app.get('io');
    io.emit('new_message', message);

    res.json(message);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ========== Stripe Webhook ==========
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.metadata.userId;
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'pro',
        subscriptionId: session.subscription
      });
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await User.findOneAndUpdate(
        { stripeCustomerId: subscription.customer },
        { subscriptionStatus: 'free', subscriptionId: null }
      );
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// ========== Socket.io ==========
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('send_message', async (data) => {
    try {
      const user = await User.findById(data.userId);
      if (user && user.subscriptionStatus === 'pro') {
        const message = new Message({
          userId: user._id,
          userName: user.name || user.email,
          userEmail: user.email,
          message: data.message
        });
        await message.save();
        io.emit('receive_message', message);
      }
    } catch (error) {
      console.error('Socket error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// ========== Start Server ==========
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});