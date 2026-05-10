const express = require('express');
const router = express.Router();
const chesscontroller = require('./chesscontroller');
const { authenticate } = require('./authenticate');

// Define routes using the router
router.get('/', authenticate, chesscontroller.getAllGames);
router.post('/', authenticate, chesscontroller.createGame);
router.post('/exit', authenticate, chesscontroller.exitGame);
router.get('/:id', authenticate, chesscontroller.getGame);
router.patch('/:id', authenticate, chesscontroller.updateGame);
router.delete('/:id', authenticate, chesscontroller.deleteGame);

module.exports = router;

