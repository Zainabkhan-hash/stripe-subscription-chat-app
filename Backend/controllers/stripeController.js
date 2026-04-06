const Stripe = require("stripe");
const User = require("../models/User");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/dashboard?success=true`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.subscriptionId) {
      return res.status(400).json({ message: "No active subscription found" });
    }

    await stripe.subscriptions.cancel(user.subscriptionId);

    user.subscriptionStatus = "free";
    user.subscriptionId = null;
    await user.save();

    res.json({ message: "Subscription cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.stripeCustomerId) {
      return res.json({ subscriptionStatus: "free" });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
    });

    if (subscriptions.data.length > 0) {
      user.subscriptionStatus = "pro";
      user.subscriptionId = subscriptions.data[0].id;
      await user.save();
    }

    res.json({ subscriptionStatus: user.subscriptionStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    try {
      event = JSON.parse(req.body.toString());
    } catch {
      return res.status(400).json({ message: "Webhook Error" });
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const user = await User.findOne({ stripeCustomerId: session.customer });
    if (user) {
      user.subscriptionStatus = "pro";
      user.subscriptionId = session.subscription;
      await user.save();
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const user = await User.findOne({ stripeCustomerId: subscription.customer });
    if (user) {
      user.subscriptionStatus = "free";
      user.subscriptionId = null;
      await user.save();
    }
  }

  res.json({ received: true });
};

module.exports = { createCheckoutSession, cancelSubscription, handleWebhook, verifyPayment };