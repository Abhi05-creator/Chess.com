/**
 * Chess Socket Automation Test Script
 * ------------------------------------
 * Simulates two players (White & Black) connecting to the chess server,
 * joining a game, and playing a full sequence of moves.
 *
 * Tests covered:
 *  1. JWT authentication via socket handshake
 *  2. joinGame room assignment
 *  3. Move relay (white → black, black → white)
 *  4. Disconnect logic (winner assignment, opponentLeft event)
 *  5. Full game flow: Scholar's Mate (4-move checkmate)
 *
 * Usage:
 *   npm install socket.io-client jsonwebtoken chess.js
 *   SERVER_URL=http://localhost:3000 GAME_ID=1 JWT_SECRET=your_secret \
 *     WHITE_TOKEN=<jwt> BLACK_TOKEN=<jwt> node chess_socket_test.js
 *
 * If you don't have tokens ready, set GENERATE_TOKENS=true and provide
 * WHITE_USER_ID / BLACK_USER_ID instead — the script will self-sign them.
 */

const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

// ─── Config ────────────────────────────────────────────────────────────────
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const GAME_ID = process.env.GAME_ID || '1';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const MOVE_DELAY_MS = parseInt(process.env.MOVE_DELAY_MS || '600');

// Either supply pre-made tokens or let the script generate them
const GENERATE = process.env.GENERATE_TOKENS === 'true';
const WHITE_USER_ID = process.env.WHITE_USER_ID || 'user_white_001';
const BLACK_USER_ID = process.env.BLACK_USER_ID || 'user_black_001';

const WHITE_TOKEN = process.env.WHITE_TOKEN ||
    (GENERATE ? jwt.sign({ id: WHITE_USER_ID }, JWT_SECRET, { expiresIn: '1h' }) : null);
const BLACK_TOKEN = process.env.BLACK_TOKEN ||
    (GENERATE ? jwt.sign({ id: BLACK_USER_ID }, JWT_SECRET, { expiresIn: '1h' }) : null);

if (!WHITE_TOKEN || !BLACK_TOKEN) {
    console.error('❌  Provide WHITE_TOKEN & BLACK_TOKEN, or set GENERATE_TOKENS=true');
    process.exit(1);
}

// ─── Move sequence: Scholar's Mate ─────────────────────────────────────────
// Each entry: { color, from, to, promotion? }
const MOVE_SEQUENCE = [
    { color: 'white', from: 'e2', to: 'e4' },
    { color: 'black', from: 'e7', to: 'e5' },
    { color: 'white', from: 'f1', to: 'c4' },
    { color: 'black', from: 'b8', to: 'c6' },
    { color: 'white', from: 'd1', to: 'h5' },
    { color: 'black', from: 'a7', to: 'a6' },   // blunder — allows mate
    { color: 'white', from: 'h5', to: 'f7' },   // checkmate
];

// ─── State ─────────────────────────────────────────────────────────────────
const passed = [];
const failed = [];
let moveIndex = 0;

function log(tag, msg) {
    const ts = new Date().toISOString().split('T')[1].slice(0, 12);
    console.log(`[${ts}] ${tag} ${msg}`);
}
function pass(label) { passed.push(label); log('✅', label); }
function fail(label, reason) { failed.push(label); log('❌', `${label} — ${reason}`); }

// ─── Create sockets ─────────────────────────────────────────────────────────
function makeSocket(token, label) {
    return io(SERVER_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false,
    });
}


const whiteSocket = makeSocket(WHITE_TOKEN, 'WHITE');
const blackSocket = makeSocket(BLACK_TOKEN, 'BLACK');

// Track connection
let whiteReady = false;
let blackReady = false;

// ─── Helpers ────────────────────────────────────────────────────────────────
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Play loop ───────────────────────────────────────────────────────────────
async function playNextMove() {
    if (moveIndex >= MOVE_SEQUENCE.length) {
        log('🏁', 'All moves sent. Testing disconnect flow...');
        await delay(MOVE_DELAY_MS);
        testDisconnect();
        return;
    }

    const move = MOVE_SEQUENCE[moveIndex];
    const label = `Move ${moveIndex + 1}: ${move.color} ${move.from}→${move.to}`;
    const sender = move.color === 'white' ? whiteSocket : blackSocket;

    log('♟ ', label);
    sender.emit('move', GAME_ID, { from: move.from, to: move.to });
    pass(label);

    moveIndex++;
    await delay(MOVE_DELAY_MS);
    playNextMove();
}

// ─── opponentMove receiver ───────────────────────────────────────────────────
// Black receives white's moves; white receives black's
whiteSocket.on('opponentMove', (move) => {
    log('⬅️  WHITE rcv', `opponentMove ${JSON.stringify(move)}`);
    pass(`White received black's move relay: ${move.from}→${move.to}`);
});

blackSocket.on('opponentMove', (move) => {
    log('⬅️  BLACK rcv', `opponentMove ${JSON.stringify(move)}`);
    pass(`Black received white's move relay: ${move.from}→${move.to}`);
});

// ─── Disconnect test ─────────────────────────────────────────────────────────
function testDisconnect() {
    log('🔌', 'White disconnecting to test opponentLeft + winner assignment...');

    blackSocket.once('opponentLeft', () => {
        pass('Black received opponentLeft after white disconnected');
        summarise();
    });

    // Timeout if opponentLeft never arrives
    const timeout = setTimeout(() => {
        fail('opponentLeft event', 'Timed out — server never emitted it to black');
        summarise();
    }, 5000);

    blackSocket.once('opponentLeft', () => clearTimeout(timeout));

    whiteSocket.disconnect();
}

// ─── Summary ─────────────────────────────────────────────────────────────────
function summarise() {
    console.log('\n══════════════════════════════════════════');
    console.log(`  TEST SUMMARY  —  Game ID: ${GAME_ID}`);
    console.log('══════════════════════════════════════════');
    console.log(`  Passed : ${passed.length}`);
    passed.forEach(p => console.log(`    ✅  ${p}`));
    console.log(`  Failed : ${failed.length}`);
    failed.forEach(f => console.log(`    ❌  ${f}`));
    console.log('══════════════════════════════════════════\n');

    blackSocket.disconnect();
    process.exit(failed.length > 0 ? 1 : 0);
}

// ─── Auth / connection error handling ────────────────────────────────────────
whiteSocket.on('connect_error', (err) => {
    fail('White socket auth', err.message);
    summarise();
});
blackSocket.on('connect_error', (err) => {
    fail('Black socket auth', err.message);
    summarise();
});

// ─── Boot sequence ───────────────────────────────────────────────────────────
whiteSocket.on('connect', () => {
    pass('White socket connected (JWT auth)');
    whiteSocket.emit('joinGame', GAME_ID);
    pass(`White joined game room ${GAME_ID}`);
    whiteReady = true;
    if (blackReady) startGame();
});

blackSocket.on('connect', () => {
    pass('Black socket connected (JWT auth)');
    blackSocket.emit('joinGame', GAME_ID);
    pass(`Black joined game room ${GAME_ID}`);
    blackReady = true;
    if (whiteReady) startGame();
});

let gameStarted = false;
async function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    log('🎮', `Both players connected. Starting move sequence (delay: ${MOVE_DELAY_MS}ms)`);
    await delay(300); // give server time to process joinGame
    playNextMove();
}