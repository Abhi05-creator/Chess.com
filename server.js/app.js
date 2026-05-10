require('dotenv').config({ path: require('path').join(__dirname, '..', 'config.env') });
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const router = require('../controller.js/routes');
const userRouter = require('../controller.js/userroute');
const setupSocket = require('../controller.js/socket.io/real-time-move');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chess';

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 30000,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection failed:', err.message));

// 1. Aggressive CORS at the very top
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 2. Request Logger
app.use((req, res, next) => {
  console.log(`Incoming Request: ${req.method} ${req.url}`);
  next();
});

// 3. Body parser
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Chess Backend is running perfectly!');
});

app.use('/api/v1/chess', router);
app.use('/api/v1/users', userRouter);

// 4. Serve Frontend Static Files
const path = require('path');
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

// 5. Catch-all route to serve the React App
app.get('(.*)', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

setupSocket(server);

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;