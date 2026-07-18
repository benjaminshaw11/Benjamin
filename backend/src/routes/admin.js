const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { User, Bet, Transaction, Wallet, Withdrawal, sequelize } = require('../models');

const router = express.Router();

// Dashboard stats
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalBets = await Bet.count();
    const totalDeposits = await Transaction.sum('amount', { where: { type: 'deposit', status: 'completed' } });
    const totalWithdrawals = await Transaction.sum('amount', { where: { type: 'withdrawal', status: 'completed' } });
    const platformRevenue = await Bet.sum('amount', { where: { status: 'lost' } });

    res.json({
      totalUsers,
      totalBets,
      totalDeposits: totalDeposits || 0,
      totalWithdrawals: totalWithdrawals || 0,
      platformRevenue: platformRevenue || 0,
      netProfit: (totalDeposits || 0) - (totalWithdrawals || 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'username', 'kycVerified', 'status', 'totalDeposits', 'totalBets', 'totalWinnings', 'createdAt'],
      include: [{ model: Wallet, attributes: ['balance', 'currency'] }]
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suspend user
router.post('/users/:userId/suspend', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    user.status = 'suspended';
    await user.save();
    res.json({ message: 'User suspended', userId: user.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get pending withdrawals
router.get('/withdrawals/pending', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.findAll({
      where: { status: 'pending' },
      include: [{ model: User, attributes: ['id', 'email', 'username'] }, { model: Transaction }],
      order: [['createdAt', 'ASC']]
    });
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve withdrawal (manual payout done externally, record approval and update ledger)
router.post('/withdrawals/:withdrawalId/approve', authMiddleware, adminMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { withdrawalId } = req.params;
    const { provider_tx_id, notes } = req.body;

    const withdrawal = await Withdrawal.findByPk(withdrawalId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!withdrawal) {
      await t.rollback();
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ error: 'Withdrawal is not pending' });
    }

    const transaction = await Transaction.findByPk(withdrawal.transactionId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!transaction) {
      await t.rollback();
      return res.status(404).json({ error: 'Associated transaction not found' });
    }

    const wallet = await Wallet.findOne({ where: { userId: withdrawal.userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!wallet) {
      await t.rollback();
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const amount = parseFloat(withdrawal.amount);
    const locked = parseFloat(wallet.locked || 0);

    if (locked < amount) {
      await t.rollback();
      return res.status(400).json({ error: 'Locked funds insufficient' });
    }

    // Deduct from balance and locked
    wallet.balance = (parseFloat(wallet.balance || 0) - amount).toFixed(2);
    wallet.locked = (locked - amount).toFixed(2);
    await wallet.save({ transaction: t });

    // Update transaction and withdrawal
    transaction.status = 'completed';
    transaction.provider_tx_id = provider_tx_id || null;
    await transaction.save({ transaction: t });

    withdrawal.status = 'approved';
    withdrawal.provider_payout_id = provider_tx_id || null;
    withdrawal.approvedBy = req.user.id;
    withdrawal.approvedAt = new Date();
    withdrawal.notes = notes || null;
    await withdrawal.save({ transaction: t });

    // Update user totals
    const user = await User.findByPk(withdrawal.userId, { transaction: t });
    if (user) {
      user.totalWithdrawals = (parseFloat(user.totalWithdrawals || 0) + amount).toFixed(2);
      await user.save({ transaction: t });
    }

    await t.commit();
    res.json({ message: 'Withdrawal approved', withdrawalId: withdrawal.id });
  } catch (err) {
    await t.rollback();
    console.error('approve withdrawal error', err);
    res.status(500).json({ error: err.message });
  }
});

// Decline withdrawal (release locked funds)
router.post('/withdrawals/:withdrawalId/decline', authMiddleware, adminMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { withdrawalId } = req.params;
    const { notes } = req.body;

    const withdrawal = await Withdrawal.findByPk(withdrawalId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!withdrawal) {
      await t.rollback();
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ error: 'Withdrawal is not pending' });
    }

    const transaction = await Transaction.findByPk(withdrawal.transactionId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!transaction) {
      await t.rollback();
      return res.status(404).json({ error: 'Associated transaction not found' });
    }

    const wallet = await Wallet.findOne({ where: { userId: withdrawal.userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!wallet) {
      await t.rollback();
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const amount = parseFloat(withdrawal.amount);
    const locked = parseFloat(wallet.locked || 0);

    if (locked < amount) {
      await t.rollback();
      return res.status(400).json({ error: 'Locked funds insufficient' });
    }

    // Release locked funds (balance unchanged because we only deducted on approve)
    wallet.locked = (locked - amount).toFixed(2);
    await wallet.save({ transaction: t });

    // Update transaction and withdrawal
    transaction.status = 'declined';
    await transaction.save({ transaction: t });

    withdrawal.status = 'declined';
    withdrawal.approvedBy = req.user.id;
    withdrawal.approvedAt = new Date();
    withdrawal.notes = notes || null;
    await withdrawal.save({ transaction: t });

    await t.commit();
    res.json({ message: 'Withdrawal declined', withdrawalId: withdrawal.id });
  } catch (err) {
    await t.rollback();
    console.error('decline withdrawal error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
