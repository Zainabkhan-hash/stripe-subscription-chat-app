# SaaS Chat App

A real-time chat application built as a Software-as-a-Service (SaaS) platform with subscription-based access using Stripe for payments.

## Features

- **User Authentication**: Secure login and registration with JWT tokens
- **Real-time Chat**: Instant messaging using Socket.io
- **Subscription Management**: Stripe integration for paid subscriptions (free and pro tiers)
- **Responsive UI**: Modern React frontend with Vite
- **MongoDB Database**: User data and chat messages storage
- **Protected Routes**: Authentication-based access control

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Stripe** for payment processing
- **bcryptjs** for password hashing

### Frontend
- **React** with Vite build tool
- **React Router** for navigation
- **Axios** for HTTP requests
- **Socket.io Client** for real-time features
- **CSS** for styling

## Project Structure

```
saas-chat-app/
├── Backend/
│   ├── config/
│   │   └── dbConfig.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   └── stripeController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── Message.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatRoutes.js
│   │   └── stripeRoutes.js
│   ├── socket/
│   │   └── socketHandler.js
│   ├── package.json
│   └── server.js
└── Frontend/
    └── saas-chat-frontend/
        ├── public/
        ├── src/
        │   ├── components/
        │   │   └── ProtectedRoute.jsx
        │   ├── context/
        │   │   └── AuthContext.jsx
        │   ├── pages/
        │   │   ├── Chat.jsx
        │   │   ├── Dashboard.jsx
        │   │   ├── Login.jsx
        │   │   └── Register.jsx
        │   ├── App.css
        │   ├── App.jsx
        │   ├── index.css
        │   └── main.jsx
        ├── package.json
        ├── vite.config.js
        └── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- Stripe account for payment processing

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd saas-chat-app
   ```

2. **Backend Setup**
   ```bash
   cd Backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../Frontend/saas-chat-frontend
   npm install
   ```

### Environment Variables

Create a `.env` file in the `Backend` directory with the following variables:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CLIENT_URL=http://localhost:3000
PORT=5000
```

### Running the Application

1. **Start the Backend**
   ```bash
   cd Backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the Frontend**
   ```bash
   cd Frontend/saas-chat-frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`

### Building for Production

1. **Build the Frontend**
   ```bash
   cd Frontend/saas-chat-frontend
   npm run build
   ```

2. **Start the Backend in Production**
   ```bash
   cd Backend
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Chat
- `GET /api/chat/messages` - Get chat messages
- `POST /api/chat/messages` - Send a message

### Stripe
- `POST /api/stripe/create-checkout-session` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Stripe webhook handler

## Socket Events

### Client to Server
- `join` - Join a chat room
- `sendMessage` - Send a message

### Server to Client
- `message` - Receive a message
- `userJoined` - User joined notification

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.