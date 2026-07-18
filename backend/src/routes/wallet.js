const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { Transaction, Wallet, User, Withdrawal, sequelize } = require('../models');

const router = express.Router();

// Create order / deposit endpoint (existing code may already do this)
// Verify deposit - client-side flow
router.post('/deposit/verify', authMiddleware, async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    // Verify signature with Razorpay
    const crypto = require('crypto');
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${orderId}|${paymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Transactional update to avoid race
    await sequelize.transaction(async (t) => {
      // Get transaction by reference
      const transaction = await Transaction.findOne({ where: { reference: orderId }, transaction: t, lock: t.LOCK.UPDATE });
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Idempotency: only process if pending
      if (transaction.status && transaction.status !== 'pending') {
        return res.json({ message: 'Already processed', newBalance: (await Wallet.findOne({ where: { userId: transaction.userId }, transaction: t })).balance });
      }

      transaction.status = 'completed';
      transaction.paymentMethod = `razorpay_${paymentId}`;
      transaction.provider = 'razorpay';
      transaction.provider_tx_id = paymentId;
      await transaction.save({ transaction: t });

      // Credit wallet using transaction.userId
      const wallet = await Wallet.findOne({ where: { userId: transaction.userId }, transaction: t, lock: t.LOCK.UPDATE });
      if (!wallet) throw new Error('Wallet not found');

      wallet.balance = (parseFloat(wallet.balance || 0) + parseFloat(transaction.amount || 0)).toFixed(2);
      await wallet.save({ transaction: t });

      // Update user deposits
      const user = await User.findByPk(transaction.userId, { transaction: t });
      user.totalDeposits = (parseFloat(user.totalDeposits || 0) + parseFloat(transaction.amount || 0)).toFixed(2);
      await user.save({ transaction: t });
    });

    res.json({ message: 'Deposit verified successfully' });
  } catch (err) {
    console.error('deposit verify error', err);
    res.status(500).json({ error: err.message });
  }
});

// Request withdrawal
router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const { amount, accountDetails } = req.body;
    const user = await User.findByPk(req.user.id);
    const wallet = await user.getWallet();

    if (amount < 500) {
      return res.status(400).json({ error: 'Minimum withdrawal is ₹500' });
    }

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create withdrawal transaction record
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'withdrawal',
      amount,
      currency: 'INR',
      status: 'pending',
      description: JSON.stringify(accountDetails)
    });

    // Create withdrawal record to track approval workflow
    const withdrawal = await Withdrawal.create({
      userId: req.user.id,
      transactionId: transaction.id,
      amount,
      accountDetails,
      status: 'pending'
    });

    // Lock funds
    wallet.locked = (parseFloat(wallet.locked || 0) + parseFloat(amount)).toFixed(2);
    await wallet.save();

    res.json({
      message: 'Withdrawal request submitted',
      transactionId: transaction.id,
      withdrawalId: withdrawal.id,
      status: 'pending'
    });
  } catch (err) {
    console.error('withdraw request error', err);
    res.status(500).json({ error: err.message });
  }
});

// Get transactions
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
