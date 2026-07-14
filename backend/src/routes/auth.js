const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Wallet } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({ email, username, password });
    
    // Create wallet
    await Wallet.create({ userId: user.id, currency: 'INR' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || '7d'
    });

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: { id: user.id, email: user.email, username: user.username }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await user.validatePassword(password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY || '7d'
    });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, username: user.username }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const wallet = await user.getWallet();

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        kycVerified: user.kycVerified,
        status: user.status,
        totalDeposits: user.totalDeposits,
        totalWithdrawals: user.totalWithdrawals,
        totalBets: user.totalBets,
        totalWinnings: user.totalWinnings
      },
      wallet: {
        balance: wallet.balance,
        currency: wallet.currency,
        locked: wallet.locked
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
