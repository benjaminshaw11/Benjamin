const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { signAccessToken, createAndStoreRefreshToken, revokeRefreshTokenByHash, findValidRefreshToken } = require('../lib/tokenService');
const { sequelize } = require('../models');

// NOTE: For production integrate this with your real credentials check.
// This login route supports a dev flow when DEV_AUTH_ENABLED=true where you can POST { userId, isAdmin }
// It is intentionally minimal — replace with your real auth in production.
router.post('/login', async (req, res) => {
  try {
    if (process.env.DEV_AUTH_ENABLED !== 'true') return res.status(403).json({ error: 'Dev login disabled' });
    const { userId, isAdmin } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const accessToken = signAccessToken({ userId, isAdmin: !!isAdmin });
    const { refreshToken, expiresAt } = await createAndStoreRefreshToken(userId);

    // set refresh token in httpOnly secure cookie; client reads access token from response
    res.setHeader('Set-Cookie', `refresh_token=${refreshToken}; HttpOnly; Path=/; Max-Age=${30*24*60*60}; SameSite=Lax`);
    return res.json({ accessToken, expiresIn: process.env.ACCESS_TOKEN_EXP || '15m' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Refresh endpoint: reads refresh token from cookie header, validates and rotates
router.post('/refresh', async (req, res) => {
  try {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('refresh_token='));
    if (!match) return res.status(401).json({ error: 'No refresh token' });
    const refreshToken = match.split('=')[1];
    const valid = await findValidRefreshToken(refreshToken);
    if (!valid) return res.status(401).json({ error: 'Invalid or expired refresh token' });

    // rotate: revoke old token and issue new
    const oldHash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
    await revokeRefreshTokenByHash(oldHash);

    const userId = valid.user_id;
    const accessToken = signAccessToken({ userId });
    const { refreshToken: newRefreshToken } = await createAndStoreRefreshToken(userId);

    res.setHeader('Set-Cookie', `refresh_token=${newRefreshToken}; HttpOnly; Path=/; Max-Age=${30*24*60*60}; SameSite=Lax`);
    return res.json({ accessToken, expiresIn: process.env.ACCESS_TOKEN_EXP || '15m' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Logout: revoke refresh token (reads cookie) and clear cookie
router.post('/logout', async (req, res) => {
  try {
    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('refresh_token='));
    if (match) {
      const refreshToken = match.split('=')[1];
      const hash = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
      await revokeRefreshTokenByHash(hash);
    }
    // clear cookie
    res.setHeader('Set-Cookie', `refresh_token=deleted; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
