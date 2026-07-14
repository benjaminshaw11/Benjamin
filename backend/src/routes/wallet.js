const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { User, Wallet, Transaction } = require('../models');
const Razorpay = require('razorpay');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Get wallet balance
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
    res.json({
      balance: wallet.balance,
      currency: wallet.currency,
      locked: wallet.locked
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initiate deposit
router.post('/deposit', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const user = await User.findByPk(req.user.id);

    if (amount < 100) {
      return res.status(400).json({ error: 'Minimum deposit is ₹100' });
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Razorpay uses paise
      currency: 'INR',
      receipt: `deposit_${user.id}_${Date.now()}`,
      notes: {
        userId: user.id,
        email: user.email
      }
    };

    const order = await razorpay.orders.create(options);

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
