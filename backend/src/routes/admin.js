const express = require('express');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { User, Bet, Transaction, Wallet } = require('../models');

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
    const withdrawals = await Transaction.findAll({
      where: { type: 'withdrawal', status: 'pending' },
      include: [{ model: User, attributes: ['id', 'email', 'username'] }]
    });
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve withdrawal
router.post('/withdrawals/:transactionId/approve', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.transactionId);
    transaction.status = 'completed';
    await transaction.save();

    const user = await User.findByPk(transaction.userId);
    user.totalWithdrawals += transaction.amount;
    await user.save();

    const wallet = await Wallet.findOne({ where: { userId: transaction.userId } });
    wallet.balance -= transaction.amount;
    wallet.locked -= transaction.amount;
    await wallet.save();

    res.json({ message: 'Withdrawal approved', transactionId: transaction.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
