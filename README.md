Chess.com Clone ♟️


A real-time multiplayer chess app built with the MERN stack and Socket.IO — because sometimes you just want to play chess at 2am against a stranger on the internet.

 What it does

Real-time multiplayer — moves sync instantly between players over WebSockets. No refreshing, no waiting.
Rank-based matchmaking — you'll be paired with someone around your skill level, not a grandmaster who'll end it in 8 moves.
Auth system — JWT-based login and registration, so your stats are actually yours.
Drag-and-drop board — built with react-chessboard and chess.js, so illegal moves are simply not an option.
Game history & dashboard — see every game you've played, your win/loss record, and where you stand on the leaderboard.


 Tech Stack
LayerToolsFrontendReact, Tailwind CSS, react-chessboard, chess.jsBackendNode.js, Express.jsDatabaseMongoDB (Mongoose)Real-timeSocket.IO
 
Getting Started
Prerequisites
Make sure you have these installed before anything else:

Node.js v16+
Git

1. Clone the repo
bashgit clone https://github.com/Abhi05-creator/Chess.com.git
cd Chess.com
2. Install dependencies
This project has two separate environments — backend at the root, frontend in its own folder.
bash# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
3. Set up environment variables
Create a .env file in the root directory:
envMONGODB_URI=your_mongodb_connection_string
JWT_SECRET=some_long_random_secret_string
PORT=5000

Using MongoDB Atlas? Just paste your Atlas connection string as MONGODB_URI and you're good to go.

4. Run the app
You'll need two terminals open — one for each server.
Terminal 1 — Backend:
bashnpm run dev
Terminal 2 — Frontend:
bashcd frontend
npm run dev
Then open http://localhost:5173 in your browser. That's it.

🎮 How to play

Sign up or log in to create your account
Head to your Dashboard and hit Find Match
Wait a moment while the matchmaker finds you an opponent
Once connected — drag, drop, and don't blunder your queen
