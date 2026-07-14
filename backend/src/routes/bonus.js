const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { User, Wallet, Bonus, Transaction } = require('../models');
const BonusSystem = require('../utils/bonusSystem');

const router = express.Router();

// Get available bonuses
router.get('/available', authMiddleware, async (req, res) => {
  try {
    const bonuses = Object.values(BonusSystem.BONUS_TYPES).map(bonus => ({
      type: bonus.type,
      name: bonus.name,
      description: bonus.description,
      ...(bonus.percentage && { percentage: bonus.percentage, maxAmount: bonus.maxAmount }),
      ...(bonus.fixedAmount && { fixedAmount: bonus.fixedAmount }),
      wagering: bonus.wagering
    }));
    res.json(bonuses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's active bonuses
router.get('/my-bonuses', authMiddleware, async (req, res) => {
  try {
    const bonuses = await Bonus.findAll({
      where: { userId: req.user.id, status: 'active' }
    });
    res.json(bonuses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Claim bonus
router.post('/claim', authMiddleware, async (req, res) => {
  try {
    const { bonusType, depositAmount } = req.body;
    const userId = req.user.id;

    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) {
      return res.status(400).json({ error: 'Wallet not found' });
    }

    // Check if user already has active bonus of this type
    const existingBonus = await Bonus.findOne({
      where: { userId, bonusType, status: 'active' }
    });

    if (existingBonus && bonusType !== 'cashback') {
      return res.status(400).json({ error: 'You already have an active bonus of this type' });
    }

    // Calculate bonus
    const bonusData = BonusSystem.calculateBonus(bonusType, depositAmount);
    if (!bonusData) {
      return res.status(400).json({ error: 'Invalid bonus or deposit amount too low' });
    }

    // Create bonus record
    const bonus = await Bonus.create({
      userId,
      bonusType,
      depositAmount,
      bonusAmount: bonusData.bonusAmount,
      wageringRequirement: bonusData.wageringRequirement,
      remainingWagering: bonusData.wageringRequirement,
      expiryDate: new Date(Date.now() + bonusData.expiryDays * 24 * 60 * 60 * 1000),
      status: 'active'
    });

    // Add bonus to wallet
    wallet.balance = BonusSystem.applyBonus(wallet.balance, bonusData);
    await wallet.save();

    // Create transaction record
    await Transaction.create({
      userId,
      type: 'bonus',
      amount: bonusData.bonusAmount,
      status: 'completed',
      description: `${bonusData.bonusType} bonus claimed`
    });

    res.json({
      message: 'Bonus claimed successfully',
      bonus: bonusData,
      newBalance: wallet.balance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update wagering after bet
router.post('/update-wagering', authMiddleware, async (req, res) => {
  try {
    const { bonusId, betAmount } = req.body;
    const userId = req.user.id;

    const bonus = await Bonus.findByPk(bonusId);
    if (!bonus || bonus.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    bonus.remainingWagering = BonusSystem.updateWagering(betAmount, bonus.remainingWagering);

    if (BonusSystem.canRedeemBonus(bonus.remainingWagering)) {
      bonus.status = 'completed';
      bonus.redeemDate = new Date();
    }

    await bonus.save();

    res.json({
      bonusId,
      remainingWagering: bonus.remainingWagering,
      completed: bonus.status === 'completed'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Redeem bonus
router.post('/redeem/:bonusId', authMiddleware, async (req, res) => {
  try {
    const bonus = await Bonus.findByPk(req.params.bonusId);
    
    if (!bonus || bonus.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!BonusSystem.canRedeemBonus(bonus.remainingWagering)) {
      return res.status(400).json({ error: 'Wagering requirement not met' });
    }

    bonus.status = 'completed';
    bonus.redeemDate = new Date();
    await bonus.save();

    res.json({ message: 'Bonus redeemed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create bonus (admin)
router.post('/create', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, bonusType, bonusAmount, wageringMultiplier } = req.body;

    const wageringRequirement = bonusAmount * wageringMultiplier;

    const bonus = await Bonus.create({
      userId,
      bonusType,
      bonusAmount,
      wageringRequirement,
      remainingWagering: wageringRequirement,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active'
    });

    // Add bonus to wallet
    const wallet = await Wallet.findOne({ where: { userId } });
    wallet.balance += bonusAmount;
    await wallet.save();

    res.json({ message: 'Bonus created', bonus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
