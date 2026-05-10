# Chess.com Clone ♟️

A real-time multiplayer chess application built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.IO.

## ✨ Features
* **Real-time Multiplayer:** Play against other users instantly using WebSockets.
* **Rank-based Matchmaking:** Find opponents with a similar skill level automatically.
* **Authentication:** Secure user login and registration system using JWT.
* **Interactive Chessboard:** Drag-and-drop piece movement with built-in move validation.
* **Game History & Dashboard:** View your past games, wins, losses, and overall ranking.

## 🛠️ Tech Stack
* **Frontend:** React, Tailwind CSS, `react-chessboard`, `chess.js`
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose)
* **Real-time Communication:** Socket.IO

## 🚀 Getting Started

Follow these beginner-friendly steps to get the project up and running on your local machine!

### Prerequisites
Make sure you have the following installed on your computer:
* [Node.js](https://nodejs.org/) (v16 or higher)
* Git

### 1. Clone the repository
Open your terminal and run:
```bash
git clone https://github.com/Abhi05-creator/Chess.com.git
cd Chess.com
```

### 2. Install Dependencies
You need to install the required packages for both the backend and the frontend.

**Backend:**
```bash
npm install
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

### 3. Environment Setup
Create a new file named `config.env` in the root folder of the project (`Chess.com/config.env`) and paste the following configuration inside it:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/chess
JWT_SECRET=your_super_secret_jwt_key_here
```
*(Note: If you are using MongoDB Atlas instead of a local database, replace the `MONGODB_URI` with your connection string).*

### 4. Run the Application
You will need to keep two terminal windows open—one for the backend and one for the frontend.

**Start the Backend Server:**
Open a terminal in the root directory and run:
```bash
npm run dev
```

**Start the Frontend Server:**
Open a new terminal, navigate to the frontend folder, and run:
```bash
cd frontend
npm run dev
```

The frontend will start running. Click the local link provided in the terminal (usually `http://localhost:5173`) to open the app in your browser!

## 🎮 How to Play
1. **Sign Up / Log In:** Create a new account.
2. **Find a Match:** Go to your Dashboard and click **Find Match**.
3. **Play:** Wait for another online player to be matched with you. Once connected, drag and drop the chess pieces to make your moves!
