const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    game_id: { type: Number, required: true, unique: true },
    whiteplayer: { type: String, required: true },
    blackplayer: { type: String, required: true },
    moves: { type: [String], default: [] },
    status: { type: String, default: 'ongoing' },
    fen: { type: String, default: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
    endedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
    winner: { type: String, default: null },
    turn: { type: String, default: 'white' },
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;