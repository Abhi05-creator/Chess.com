const User = require('../model.js/chessusermodel');
const Game = require('../model.js/gamemodel');
const { Chess } = require('chess.js');

const createGame = async (req, res) => {
    const { whiteplayer, blackplayer } = req.body;
    const newGame = {
        game_id: Date.now(),
        whiteplayer,
        blackplayer,
        moves: [],
        status: 'ongoing',
    };

    try {
        const game = new Game(newGame);
        await game.save();

        // Mark both players as 'ingame'
        await User.updateMany(
            { username: { $in: [whiteplayer, blackplayer] } },
            { status: 'ingame' }
        );

        res.status(201).json(game);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllGames = async (req, res) => {
    try {
        const games = await Game.find();
        res.json(games);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getGame = async (req, res) => {
    try {
        const { id } = req.params;
        const game = await Game.findOne({ game_id: parseInt(id) });
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        res.json(game);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateGame = async (req, res) => {
    const { id } = req.params;
    const { move } = req.body;

    try {
        const game = await Game.findOne({ game_id: parseInt(id) });
        if (!game) throw new Error('Game not found');

        const chess = new Chess(game.fen);
        let moved;
        try {
            moved = chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
        } catch (e) {
            throw new Error('Invalid move');
        }

        game.fen = chess.fen();
        game.moves.push(moved.san); // store SAN string
        game.turn = game.turn === 'white' ? 'black' : 'white';

        // check game over conditions
        if (chess.isCheckmate()) {
            game.status = 'finished';
            const loser = chess.turn();  // 'w' or 'b' — the side that got mated
            game.winner = loser === 'w' ? 'black' : 'white';

            const whiteWon = game.winner === 'white';
            
            // Set both players back to 'outgame'
            await User.updateMany(
                { username: { $in: [game.whiteplayer, game.blackplayer] } },
                { status: 'outgame' }
            );

            await User.findOneAndUpdate(
                { username: game.whiteplayer },
                { $inc: { rank: whiteWon ? 100 : -50, gamesPlayed: 1, wins: whiteWon ? 1 : 0, losses: whiteWon ? 0 : 1 } }
            );
            await User.findOneAndUpdate(
                { username: game.blackplayer },
                { $inc: { rank: whiteWon ? -50 : 100, gamesPlayed: 1, wins: whiteWon ? 0 : 1, losses: whiteWon ? 1 : 0 } }
            );
        } else if (chess.isDraw()) {
            game.status = 'finished';
            game.winner = 'draw';
        }

        await game.save();
        res.status(200).json({ message: 'Move made successfully', game });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const exitGame = async (req, res) => {
    const { gameId } = req.body;
    try {
        const game = await Game.findOne({ game_id: parseInt(gameId) });
        if (!game) return res.status(404).json({ message: 'Game not found' });

        const winner = game.turn === 'white' ? 'black' : 'white';
        const loser = game.turn;

        await Game.findOneAndUpdate({ game_id: parseInt(gameId) }, {
            status: 'finished',
            winner: winner,
            endedAt: new Date(),
        });

        const whiteWon = winner === 'white';

        // Set both players back to 'outgame'
        await User.updateMany(
            { username: { $in: [game.whiteplayer, game.blackplayer] } },
            { status: 'outgame' }
        );

        await User.findOneAndUpdate(
            { username: game.whiteplayer },
            { $inc: { rank: whiteWon ? 100 : -50, gamesPlayed: 1, wins: whiteWon ? 1 : 0, losses: whiteWon ? 0 : 1 } }
        );
        await User.findOneAndUpdate(
            { username: game.blackplayer },
            { $inc: { rank: whiteWon ? -50 : 100, gamesPlayed: 1, wins: whiteWon ? 0 : 1, losses: whiteWon ? 1 : 0 } }
        );

        res.json({ message: 'Game ended', winner });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteGame = async (req, res) => {
    const { id } = req.params;
    try {
        const game = await Game.findOneAndDelete({ game_id: parseInt(id) });
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        res.json({ message: 'Game deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createGame, getAllGames, getGame, updateGame, exitGame, deleteGame };
