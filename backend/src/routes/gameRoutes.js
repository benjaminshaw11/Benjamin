/**
 * Game Routes
 * API endpoints for casino games
 */

const express = require('express');
const router = express.Router();
const GameController = require('../controllers/gameController');
const { authenticate } = require('../middleware/auth');

// Middleware
router.use(authenticate);

// Session Management
router.post('/session/init', GameController.initializeSession);
router.post('/session/:sessionId/client-seed', GameController.setClientSeed);
router.post('/session/:sessionId/end', GameController.endSession);

// Dice Game
router.post('/dice/bet', GameController.diceBet);

// Roulette Game
router.post('/roulette/bet', GameController.rouletteBet);

// Crash Game
router.post('/crash/bet', GameController.crashBet);

// Mines Game
router.post('/mines/start', GameController.minesStart);
router.post('/mines/reveal', GameController.minesReveal);

// Color Prediction Game
router.post('/color/bet', GameController.colorBet);

// Game History & Verification
router.get('/:sessionId/history', GameController.getGameHistory);
router.post('/:sessionId/verify', GameController.verifyFairness);

module.exports = router;
