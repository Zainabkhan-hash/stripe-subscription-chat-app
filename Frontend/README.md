# SaaS Chat Frontend

The frontend application for the SaaS Chat App, built with React and Vite.

## Features

- **Modern React App**: Built with React 19 and Vite for fast development
- **Routing**: Client-side routing with React Router
- **Authentication Context**: Global auth state management
- **Real-time Chat**: Socket.io integration for instant messaging
- **Responsive Design**: Mobile-friendly UI
- **Protected Routes**: Authentication-based access control

## Tech Stack

- **React** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **Socket.io Client** - Real-time communication
- **ESLint** - Code linting

## Project Structure

```
src/
├── components/
│   └── ProtectedRoute.jsx      # Route protection component
├── context/
│   └── AuthContext.jsx         # Authentication context provider
├── pages/
│   ├── Chat.jsx                # Chat interface
│   ├── Dashboard.jsx           # User dashboard
│   ├── Login.jsx               # Login page
│   └── Register.jsx            # Registration page
├── App.css                     # Main app styles
├── App.jsx                     # Main app component with routing
├── index.css                   # Global styles
└── main.jsx                    # App entry point
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Backend server running (see root README)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

The frontend connects to the backend API. Make sure the backend is running on the configured URL (default: `http://localhost:5000`).

## Components Overview

### AuthContext
Provides authentication state and methods throughout the app:
- `login(user)` - Log in a user
- `logout()` - Log out current user
- `user` - Current user object
- `isAuthenticated` - Authentication status

### ProtectedRoute
Wraps components that require authentication. Redirects to login if not authenticated.

### Pages

- **Login**: User authentication form
- **Register**: User registration form
- **Dashboard**: User dashboard with subscription info
- **Chat**: Real-time chat interface

## API Integration

The frontend communicates with the backend via:
- **Axios** for REST API calls (auth, stripe)
- **Socket.io Client** for real-time chat messages

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

## Contributing

1. Follow the existing code style
2. Run `npm run lint` before committing
3. Test changes in development mode
4. Ensure responsive design works on mobile devices