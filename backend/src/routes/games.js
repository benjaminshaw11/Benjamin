const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { User, Wallet, Bet } = require('../models');
const FairPlaySystem = require('../utils/fairplay');
const GameEngine = require('../utils/gameEngine');
const OddsCalculator = require('../utils/odds');
const crypto = require('crypto');
const { canPlaceWager } = require('../services/riskService');

const router = express.Router();

// Get available games
router.get('/', (req, res) => {
  const games = [ /* ... unchanged ... */ ];
  res.json(games);
});

// Place bet
router.post('/bet', authMiddleware, async (req, res) => {
  try {
    const { gameType, amount, clientSeed, betData } = req.body;
    const userId = req.user.id;

    // Validate bet amount
    if (amount < 10 || amount > 100000) {
      return res.status(400).json({ error: 'Bet amount out of range' });
    }

    // Get wallet
    const user = await User.findByPk(userId);
    const wallet = await user.getWallet();

    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Risk check: non-KYC wagering limits
    const canWager = await canPlaceWager(user, Math.round(amount * 100));
    if (!canWager) {
      return res.status(403).json({ error: 'Complete KYC to place this wager or reduce bet size' });
    }

    // Generate server seed and nonce
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const nonce = Date.now();
    const random = FairPlaySystem.generateRandom(serverSeed, clientSeed, nonce);

    // Calculate game result
    let gameResult, odds, won;

    switch (gameType) {
      case 'dice':
        gameResult = GameEngine.diceBet(random, betData.targetMultiplier);
        odds = betData.targetMultiplier;
        won = gameResult.result === 'win';
        break;
      case 'crash':
        gameResult = GameEngine.crashGame(random);
        odds = gameResult.multiplier;
        won = betData.cashoutMultiplier <= gameResult.multiplier;
        break;
      case 'color':
        gameResult = GameEngine.colorPrediction(random);
        odds = gameResult.odds;
        won = gameResult.color === betData.predictedColor;
        break;
      case 'roulette':
        gameResult = GameEngine.rouletteSpin(random);
        odds = betData.betType === 'color' ? 2 : 37;
        won = gameResult.color === betData.color;
        break;
      case 'mines':
        gameResult = GameEngine.minesGame(random, betData.mineCount);
        odds = 1 + (betData.position * 0.1);
        won = !gameResult.mines.includes(betData.selectedPosition);
        break;
      case 'plinko':
        gameResult = GameEngine.plinkoBall(random);
        odds = gameResult.multiplier;
        won = true;
        break;
      default:
        return res.status(400).json({ error: 'Invalid game type' });
    }

    // Calculate payout
    const payout = won ? OddsCalculator.calculatePayout(amount, odds) : 0;
    const profit = payout - amount;

    // Deduct bet from wallet
    wallet.balance -= amount;
    await wallet.save();

    // Create bet record
    const bet = await Bet.create({
      userId,
      gameType,
      amount,
      odds,
      potential_payout: OddsCalculator.calculatePayout(amount, odds),
      status: won ? 'won' : 'lost',
      payout,
      gameData: gameResult,
      betData,
      result: {
        serverSeed,
        clientSeed,
        nonce,
        random,
        won
      }
    });

    // Add payout to wallet if won
    if (won) {
      wallet.balance += payout;
      await wallet.save();
    }

    // Update user stats and daily wagered
    user.totalBets += parseFloat(amount);
    user.dailyWageredCents = Number(user.dailyWageredCents || 0) + Math.round(amount * 100);
    if (won) user.totalWinnings += profit;
    await user.save();

    res.json({
      betId: bet.id,
      gameResult,
      payout,
      won,
      newBalance: wallet.balance,
      verificationData: {
        serverSeedHash: FairPlaySystem.getServerSeedHash(serverSeed),
        clientSeed,
        nonce,
        random
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get bet history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const bets = await Bet.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(bets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify bet fairness
router.post('/verify', async (req, res) => {
  try {
    const { betId, serverSeed } = req.body;
    const bet = await Bet.findByPk(betId);

    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }

    const verified = FairPlaySystem.verifyResult({
      serverSeed,
      clientSeed: bet.result.clientSeed,
      nonce: bet.result.nonce,
      serverSeedHash: FairPlaySystem.getServerSeedHash(serverSeed),
      randomValue: bet.result.random
    });

    res.json({
      verified,
      betId,
      gameType: bet.gameType,
      result: bet.result,
      gameData: bet.gameData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
