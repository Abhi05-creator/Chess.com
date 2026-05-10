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

// Use built-in middleware
app.use(express.json());

// Permissive CORS for production
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/', (req, res) => {
  res.send('Chess Backend is running perfectly!');
});

app.use('/api/v1/chess', router);
app.use('/api/v1/users', userRouter);

setupSocket(server);

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;