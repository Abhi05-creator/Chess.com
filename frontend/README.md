# Chess Master Frontend

A modern React frontend for the Chess Master online chess game.

## Features

- User Authentication (Login/Signup with JWT)
- Real-time Chess Gameplay with WebSocket
- Matchmaking System
- Leaderboard
- Match History
- Responsive Dark UI

## Tech Stack

- React 18
- Tailwind CSS
- react-chessboard
- chess.js
- axios
- socket.io-client
- React Router v6

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

The app will run on `http://localhost:5173`

## Build for Production

```bash
npm run build
```

## Backend Integration

The frontend connects to the backend API at `http://localhost:3000`. Make sure the backend server is running before starting the frontend.

## API Endpoints

### Authentication
- POST `/api/v1/users/login` - User login
- POST `/api/v1/users/signup` - User registration

### Games
- GET `/api/v1/chess` - Get all games
- GET `/api/v1/chess/:id` - Get specific game
- POST `/api/v1/chess` - Create new game
- PATCH `/api/v1/chess/:id` - Make a move
- POST `/api/v1/chess/exit` - Exit/resign game

### Users
- GET `/api/v1/users` - Get all users
- GET `/api/v1/users/:id` - Get user by ID

## Socket Events

- `joinGame` - Join a game room
- `move` - Send a move to opponent
- `opponentMove` - Receive opponent's move
- `opponentLeft` - Opponent disconnected

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx
│   └── ProtectedRoute.jsx
├── contexts/
│   ├── AuthContext.jsx
│   └── SocketContext.jsx
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   ├── Game.jsx
│   ├── Matchmaking.jsx
│   ├── Leaderboard.jsx
│   └── History.jsx
├── services/
│   └── api.js
├── App.jsx
├── main.jsx
└── index.css
```
