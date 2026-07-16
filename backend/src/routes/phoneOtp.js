const express = require('express');
const router = express.Router();
const otpService = require('../services/otpService');

// POST /api/phone/send { phone }
router.post('/send', async (req, res) => {
  try {
    const phone = req.body.phone;
    if (!phone) return res.status(400).json({ error: 'phone required' });
    const result = await otpService.sendOtp(phone);
    return res.json(result);
  } catch (e) {
    console.error('send otp error', e);
    return res.status(500).json({ error: 'send failed' });
  }
});

// POST /api/phone/verify { phone, code }
router.post('/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'phone and code required' });
    const result = await otpService.verifyOtp(phone, code);
    if (!result.ok) return res.status(400).json({ error: result.reason || 'invalid' });

    // if Authorization Bearer token present, mark user's phoneVerified
    await otpService.markUserPhoneVerifiedIfAuthenticated(req, phone);

    return res.json({ ok: true });
  } catch (e) {
    console.error('verify otp error', e);
    return res.status(500).json({ error: 'verify failed' });
  }
});

module.exports = router;
