const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { User, Wallet, Bet, Transaction, sequelize } = require('../models');
const FairPlaySystem = require('../utils/fairplay');
const GameEngine = require('../utils/gameEngine');
const OddsCalculator = require('../utils/odds');
const crypto = require('crypto');

const router = express.Router();

// Helper: encrypt server seed if key present
function encryptSeed(seed) {
  const key = process.env.SEED_ENCRYPTION_KEY;
  if (!key) return null;
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(seed, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  } catch (e) {
    console.warn('encryptSeed failed', e);
    return null;
  }
}

function parseBetResult(resultField) {
  if (!resultField) return null;
  if (typeof resultField === 'object') return resultField;
  try {
    return JSON.parse(resultField);
  } catch (e) {
    // fallback: if stored as stringified [object Object], return null
    return null;
  }
}

// Get available games
router.get('/', (req, res) => {
  const games = [
    {
      id: 'dice',
      name: 'Dice',
      description: 'Roll the dice and win',
      minBet: 10,
      maxBet: 100000,
      houseEdge: 0.05
    },
    // other games omitted for brevity
  ];

  res.json(games);
});

// Place bet (generic endpoint)
router.post('/bet', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { gameType, amount, clientSeed, betData } = req.body;
    const userId = req.user.id;

    // Basic validation
    if (!amount || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Invalid bet amount' });
    }

    // Validate min/max from a small lookup - for now use safe bounds
    if (amount < 0.01 || amount > 1000000) {
      await t.rollback();
      return res.status(400).json({ error: 'Bet amount out of allowed range' });
    }

    // Lock and load wallet
    const wallet = await Wallet.findOne({ where: { userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!wallet) {
      await t.rollback();
      return res.status(400).json({ error: 'Wallet not found for user' });
    }

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      await t.rollback();
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Generate server seed and nonce
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const serverSeedHash = FairPlaySystem.getServerSeedHash(serverSeed);
    const nonce = Date.now();

    const normalRandom = FairPlaySystem.generateRandom(serverSeed, clientSeed || '', nonce);
    const { usedRandom, rigged } = FairPlaySystem.applyRig(normalRandom, gameType, betData || {});

    // Calculate game result
    let gameResult = null;
    let odds = 1;
    let won = false;

    switch (gameType) {
      case 'dice': {
        const target = betData?.target || (betData?.targetMultiplier);
        gameResult = GameEngine.diceBet(usedRandom, target);
        odds = betData?.payout || OddsCalculator.getPayoutForTarget(target, 0.05);
        won = !!(gameResult && gameResult.result === 'win');
        break;
      }
      case 'crash': {
        gameResult = GameEngine.crashGame(usedRandom);
        odds = gameResult.multiplier || 1;
        won = betData?.cashoutMultiplier && (betData.cashoutMultiplier <= gameResult.multiplier);
        break;
      }
      default: {
        await t.rollback();
        return res.status(400).json({ error: 'Unsupported game type' });
      }
    }

    // Calculate payout
    const payout = won ? parseFloat(OddsCalculator.calculatePayout(amount, odds)) : 0;
    const profit = payout - amount;

    // Debit bet amount from wallet (record a Transaction)
    const beforeBalance = parseFloat(wallet.balance);
    const afterDebit = (beforeBalance - parseFloat(amount)).toFixed(2);
    wallet.balance = afterDebit;
    await wallet.save({ transaction: t });

    await Transaction.create({
      walletId: wallet.id,
      type: 'debit',
      amount: parseFloat(amount),
      balanceAfter: afterDebit,
      meta: { reason: 'bet', gameType }
    }, { transaction: t });

    // Create bet record -- store serverSeedHash and encrypted seed if possible
    const encryptedSeed = encryptSeed(serverSeed);
    const betRecord = await Bet.create({
      userId,
      gameType,
      amount,
      prediction: betData ? JSON.stringify(betData) : null,
      result: JSON.stringify({ serverSeedHash, clientSeed: clientSeed || '', nonce, normalRandom, usedRandom, won }),
      isWin: won,
      payout: payout,
      profit: profit,
      nonce,
      houseEdge: 0.05,
      rtp: null,
      metadata: { gameResult, encryptedServerSeed: encryptedSeed, rigged }
    }, { transaction: t });

    // If won, credit payout
    if (won && payout > 0) {
      const newBalance = (parseFloat(wallet.balance) + parseFloat(payout)).toFixed(2);
      wallet.balance = newBalance;
      await wallet.save({ transaction: t });

      await Transaction.create({
        walletId: wallet.id,
        type: 'credit',
        amount: parseFloat(payout),
        balanceAfter: newBalance,
        meta: { reason: 'payout', betId: betRecord.id }
      }, { transaction: t });
    }

    // Update user stats
    const user = await User.findByPk(userId, { transaction: t });
    if (user) {
      user.totalBets = (parseFloat(user.totalBets || 0) + parseFloat(amount)).toFixed(2);
      if (won) user.totalWinnings = (parseFloat(user.totalWinnings || 0) + parseFloat(profit)).toFixed(2);
      await user.save({ transaction: t });
    }

    await t.commit();

    // Emit socket event to user's room if socket system is available on req.app
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${userId}`).emit('bet:settled', {
          betId: betRecord.id,
          gameResult,
          payout,
          won,
          newBalance: wallet.balance,
          rigged
        });
      }
    } catch (e) {
      // emit is best-effort
      console.warn('Socket emit failed', e);
    }

    return res.json({
      betId: betRecord.id,
      gameResult,
      payout,
      won,
      newBalance: wallet.balance,
      verificationData: {
        serverSeedHash,
        clientSeed: clientSeed || '',
        nonce,
        normalRandom,
        usedRandom
      },
      rigged
    });
  } catch (err) {
    try { await t.rollback(); } catch (e) {}
    console.error('bet error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
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
    if (!betId || !serverSeed) return res.status(400).json({ error: 'betId and serverSeed required' });

    const bet = await Bet.findByPk(betId);
    if (!bet) return res.status(404).json({ error: 'Bet not found' });

    const parsed = parseBetResult(bet.result);
    if (!parsed) return res.status(400).json({ error: 'Bet result not parseable' });

    const verified = FairPlaySystem.verifyResult({
      serverSeed,
      clientSeed: parsed.clientSeed,
      nonce: parsed.nonce,
      serverSeedHash: FairPlaySystem.getServerSeedHash(serverSeed),
      randomValue: parsed.normalRandom
    });

    res.json({
      verified,
      betId,
      gameType: bet.gameType,
      result: parsed,
      gameData: bet.metadata
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
