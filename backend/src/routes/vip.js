const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { User, VIPUser, Bet, Transaction } = require('../models');
const VIPSystem = require('../utils/vipSystem');

const router = express.Router();

// Get VIP status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    let vipUser = await VIPUser.findOne({ where: { userId: req.user.id } });

    if (!vipUser) {
      vipUser = await VIPUser.create({ userId: req.user.id });
    }

    const tier = VIPSystem.getTierByPoints(vipUser.totalPoints);
    const nextTier = VIPSystem.getNextTierRequirements(vipUser.totalPoints);

    res.json({
      currentTier: vipUser.currentTier,
      totalPoints: vipUser.totalPoints,
      monthlySpent: vipUser.monthlySpent,
      monthlyBonus: vipUser.monthlyBonus,
      totalCashback: vipUser.totalCashback,
      tierInfo: tier,
      nextTier
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update points after bet
router.post('/update-points', authMiddleware, async (req, res) => {
  try {
    const { betAmount } = req.body;
    const userId = req.user.id;

    let vipUser = await VIPUser.findOne({ where: { userId } });
    if (!vipUser) {
      vipUser = await VIPUser.create({ userId });
    }

    // Calculate points
    const points = VIPSystem.calculatePoints(betAmount);
    vipUser.totalPoints += points;

    // Check for tier upgrade
    const newTier = VIPSystem.getTierByPoints(vipUser.totalPoints);
    if (newTier.key !== vipUser.currentTier) {
      vipUser.currentTier = newTier.key;
      vipUser.lastTierUpgrade = new Date();
    }

    await vipUser.save();

    res.json({
      totalPoints: vipUser.totalPoints,
      pointsEarned: points,
      currentTier: vipUser.currentTier,
      tierInfo: newTier
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get monthly rewards
router.get('/monthly-rewards', authMiddleware, async (req, res) => {
  try {
    const vipUser = await VIPUser.findOne({ where: { userId: req.user.id } });
    if (!vipUser) {
      return res.status(404).json({ error: 'VIP profile not found' });
    }

    const tier = VIPSystem.getTierByPoints(vipUser.totalPoints);
    const rewards = VIPSystem.calculateLoyaltyRewards(vipUser.monthlySpent, tier);

    res.json({
      monthlyRewards: rewards,
      nextResetDate: new Date(Date.now() + (30 - new Date().getDate()) * 24 * 60 * 60 * 1000)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Claim monthly bonus
router.post('/claim-monthly-bonus', authMiddleware, async (req, res) => {
  try {
    const vipUser = await VIPUser.findOne({ where: { userId: req.user.id } });
    if (!vipUser) {
      return res.status(404).json({ error: 'VIP profile not found' });
    }

    const tier = VIPSystem.getTierByPoints(vipUser.totalPoints);
    const monthlyBonus = VIPSystem.getMonthlyBonus(tier);

    // Add bonus to wallet
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    wallet.balance += monthlyBonus;
    await wallet.save();

    // Create transaction
    await Transaction.create({
      userId: req.user.id,
      type: 'bonus',
      amount: monthlyBonus,
      status: 'completed',
      description: `${tier.name} VIP monthly bonus`
    });

    vipUser.monthlyBonus = 0;
    vipUser.monthlySpent = 0;
    await vipUser.save();

    res.json({
      message: 'Monthly bonus claimed',
      bonusAmount: monthlyBonus,
      newBalance: wallet.balance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
