const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { Transaction, Wallet, User } = require('../models');

const router = express.Router();

// Create deposit order (Razorpay integration assumed)
router.post('/deposit', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const order = { id: `order_${Date.now()}`, amount, currency: 'INR' };

    // Create transaction record
    await Transaction.create({
      userId: req.user.id,
      type: 'deposit',
      amount,
      currency: 'INR',
      status: 'pending',
      paymentMethod: 'razorpay',
      reference: order.id
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify deposit
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

    // Get transaction
    const transaction = await Transaction.findOne({ where: { reference: orderId } });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update transaction status
    transaction.status = 'completed';
    transaction.paymentMethod = `razorpay_${paymentId}`;
    await transaction.save();

    // Add funds to wallet
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    wallet.balance += transaction.amount;
    await wallet.save();

    // Update user deposits
    const user = await User.findByPk(req.user.id);
    user.totalDeposits += transaction.amount;
    await user.save();

    res.json({
      message: 'Deposit verified successfully',
      newBalance: wallet.balance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Request withdrawal
router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const { amount, accountDetails } = req.body;
    const user = await User.findByPk(req.user.id);
    const wallet = await user.getWallet();

    // Enforce KYC for withdrawals
    if (user.kycStatus !== 'approved') {
      return res.status(403).json({ error: 'Complete KYC to withdraw funds' });
    }

    if (amount < 500) {
      return res.status(400).json({ error: 'Minimum withdrawal is ₹500' });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      userId: req.user.id,
      type: 'withdrawal',
      amount,
      currency: 'INR',
      status: 'pending',
      description: JSON.stringify(accountDetails)
    });

    // Lock funds
    wallet.locked += amount;
    await wallet.save();

    res.json({
      message: 'Withdrawal request submitted',
      transactionId: transaction.id,
      status: 'pending'
    });
  } catch (err) {
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
