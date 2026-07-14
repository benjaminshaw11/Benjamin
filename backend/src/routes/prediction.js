const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { User, Wallet, PredictionMarket, PredictionBet } = require('../models');
const OddsCalculator = require('../utils/odds');

const router = express.Router();

// Get all markets
router.get('/markets', async (req, res) => {
  try {
    const markets = await PredictionMarket.findAll({
      where: { status: ['open', 'closed'] },
      order: [['resolutionDate', 'ASC']]
    });
    res.json(markets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get market details
router.get('/markets/:marketId', async (req, res) => {
  try {
    const market = await PredictionMarket.findByPk(req.params.marketId);
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }
    res.json(market);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create market (admin only)
router.post('/markets', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, category, resolutionDate } = req.body;
    
    const market = await PredictionMarket.create({
      title,
      description,
      category,
      resolutionDate,
      yesOdds: 1.95,
      noOdds: 1.95
    });

    res.status(201).json(market);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Place prediction bet
router.post('/bet', authMiddleware, async (req, res) => {
  try {
    const { marketId, prediction, amount } = req.body;
    const userId = req.user.id;

    const market = await PredictionMarket.findByPk(marketId);
    if (!market || market.status !== 'open') {
      return res.status(400).json({ error: 'Market not available' });
    }

    if (amount < 10 || amount > 100000) {
      return res.status(400).json({ error: 'Amount out of range' });
    }

    const user = await User.findByPk(userId);
    const wallet = await user.getWallet();

    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const odds = prediction === 'yes' ? market.yesOdds : market.noOdds;
    const potential_payout = OddsCalculator.calculatePayout(amount, odds);

    // Deduct from wallet
    wallet.balance -= amount;
    await wallet.save();

    // Create bet
    const bet = await PredictionBet.create({
      userId,
      marketId,
      prediction,
      amount,
      odds,
      potential_payout,
      status: 'open'
    });

    // Update market pools and odds
    if (prediction === 'yes') {
      market.yesPool += amount;
    } else {
      market.noPool += amount;
    }
    market.totalVolume += amount;

    // Recalculate odds based on pool imbalance
    const totalPool = market.yesPool + market.noPool;
    if (totalPool > 0) {
      market.yesOdds = OddsCalculator.adjustOdds(2.0, market.yesPool, market.noPool);
      market.noOdds = OddsCalculator.adjustOdds(2.0, market.noPool, market.yesPool);
    }

    await market.save();

    res.status(201).json({
      betId: bet.id,
      market: { id: market.id, yesOdds: market.yesOdds, noOdds: market.noOdds }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's prediction bets
router.get('/my-bets', authMiddleware, async (req, res) => {
  try {
    const bets = await PredictionBet.findAll({
      where: { userId: req.user.id },
      include: [{ model: PredictionMarket, attributes: ['title', 'status', 'resolution'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(bets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve market (admin only)
router.post('/markets/:marketId/resolve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { resolution } = req.body;
    const market = await PredictionMarket.findByPk(req.params.marketId);

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    market.status = 'resolved';
    market.resolution = resolution;
    market.resolvedAt = new Date();
    await market.save();

    // Settle bets
    const bets = await PredictionBet.findAll({ where: { marketId: req.params.marketId, status: 'open' } });
    
    for (let bet of bets) {
      if (bet.prediction === resolution) {
        // User won
        bet.status = 'won';
        bet.payout = bet.potential_payout;
        
        // Add payout to wallet
        const wallet = await Wallet.findOne({ where: { userId: bet.userId } });
        wallet.balance += bet.payout;
        await wallet.save();

        // Update user stats
        const user = await User.findByPk(bet.userId);
        user.totalWinnings += (bet.payout - bet.amount);
        await user.save();
      } else {
        bet.status = 'lost';
      }
      await bet.save();
    }

    res.json({ message: 'Market resolved', betsSettled: bets.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
