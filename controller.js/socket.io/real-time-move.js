const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Game = require('../../model.js/gamemodel');
const User = require('../../model.js/chessusermodel');

module.exports = function setupSocket(server) {
    const io = new Server(server, {
        cors: { origin: '*' }
    });

    io.use((socket, next) => {
        const token = socket.handshake.query.token || socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error'));
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (err) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', async (socket) => {

        socket.on('joinGame', (gameId) => {
            console.log('DEBUG: joinGame received, gameId:', gameId, 'socketId:', socket.id);
            console.log('Client joined game:', gameId);
            socket.join(String(gameId));
            socket.gameId = String(gameId);
            console.log('DEBUG: socket.gameId set to:', socket.gameId);
        });

        // Relay move to opponent (server-side validation is a future improvement)
        socket.on('move', (gameId, move) => {
            socket.to(String(gameId)).emit('opponentMove', move);
        });

        socket.on('disconnect', async () => {
            try{
            await User.findByIdAndUpdate(socket.userId, { status: 'offline' });
            }catch(e){
                console.error('Step 1 error:', e.message);
            }
            if (!socket.gameId){
                 console.log('DEBUG: no gameId on socket');  
                 return
                
            }
            try{
            const game = await Game.findOne({ game_id: parseInt(socket.gameId) });
            if (game && game.status === 'ongoing') {
                // Players are stored as usernames; determine winner by whose turn it was
                const winner = game.turn === 'white' ? 'black' : 'white';
                const whiteWon = winner === 'white';

                await Game.findOneAndUpdate(
                    { game_id: parseInt(socket.gameId) },
                    { status: 'finished', winner, endedAt: new Date() }
                );
                await User.updateMany(
                    { username: { $in: [game.whiteplayer, game.blackplayer] } },
                    { status: 'outgame' }
                );

                // Final override: the user who disconnected MUST be offline
                await User.findByIdAndUpdate(socket.userId, { status: 'offline' });

                socket.to(socket.gameId).emit('opponentLeft');
            }
               await User.findByIdAndUpdate(socket.userId, { status: 'outgame' });
        }catch(error){
            console.log(error);
        }
        });
    });
};
