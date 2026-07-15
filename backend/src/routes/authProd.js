const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { signAccessToken, createAndStoreRefreshToken } = require('../lib/tokenService');
const { sequelize } = require('../models');

// Simple in-memory rate limiter per key (email or ip); suitable for small deployments/dev only
const ATTEMPT_LIMIT = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const attempts = new Map();

function recordFailure(key) {
  const now = Date.now();
  const entry = attempts.get(key) || { count: 0, first: now };
  if (now - entry.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
  } else {
    attempts.set(key, { count: entry.count + 1, first: entry.first });
  }
}

function isBlocked(key) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry) return false;
  if (now - entry.first > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= ATTEMPT_LIMIT;
}

// POST /api/auth/login
// Supports two modes:
// - Dev mode (DEV_AUTH_ENABLED=true) where body { userId, isAdmin } will create token for that userId
// - Prod mode: body { email, password } checks users table and issues tokens
router.post('/login', async (req, res) => {
  try {
    // Dev route if explicitly enabled and userId provided
    if (process.env.DEV_AUTH_ENABLED === 'true' && req.body && req.body.userId) {
      const { userId, isAdmin } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId required' });
      const accessToken = signAccessToken({ userId, isAdmin: !!isAdmin });
      const { refreshToken } = await createAndStoreRefreshToken(userId);
      res.setHeader('Set-Cookie', `refresh_token=${refreshToken}; HttpOnly; Path=/; Max-Age=${30*24*60*60}; SameSite=Lax`);
      return res.json({ accessToken, expiresIn: process.env.ACCESS_TOKEN_EXP || '15m' });
    }

    // Production login flow
    const { email, password } = req.body || {};
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const key = (email || ip || 'unknown').toLowerCase();

    if (isBlocked(key)) return res.status(429).json({ error: 'Too many login attempts. Try again later.' });

    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    // find user by email
    const [rows] = await sequelize.query('SELECT id, password_hash, is_admin, role FROM users WHERE lower(email) = lower($1) LIMIT 1', { bind: [email] });
    if (!rows || !rows.length) {
      recordFailure(key);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = rows[0];
    if (!user.password_hash) {
      recordFailure(key);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      recordFailure(key);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // successful login: clear attempts
    attempts.delete(key);

    const isAdmin = !!user.is_admin || user.role === 'admin';
    const accessToken = signAccessToken({ userId: user.id, isAdmin });
    const { refreshToken } = await createAndStoreRefreshToken(user.id);
    res.setHeader('Set-Cookie', `refresh_token=${refreshToken}; HttpOnly; Path=/; Max-Age=${30*24*60*60}; SameSite=Lax`);
    return res.json({ accessToken, expiresIn: process.env.ACCESS_TOKEN_EXP || '15m' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
