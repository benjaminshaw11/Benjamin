const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Dev-only login to generate JWTs for testing. Enable via DEV_AUTH_ENABLED=true (DO NOT enable in production)
router.post('/login', (req, res) => {
  if (process.env.DEV_AUTH_ENABLED !== 'true') return res.status(403).json({ error: 'Dev auth disabled' });
  const { userId, isAdmin } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const token = jwt.sign({ userId, isAdmin: !!isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return res.json({ token });
});

module.exports = router;
