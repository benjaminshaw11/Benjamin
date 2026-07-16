const crypto = require('crypto');
const { OtpCode, User } = require('../models');

const DEFAULT_TTL_MS = Number(process.env.OTP_TTL_MS || 5 * 60 * 1000); // 5 minutes
const MAX_VERIFY_ATTEMPTS = Number(process.env.OTP_MAX_VERIFY_ATTEMPTS || 5);

function hashOtp(phone, code) {
  // HMAC with server secret
  const secret = process.env.OTP_HMAC_SECRET || 'dev-secret';
  return crypto.createHmac('sha256', secret).update(`${phone}:${code}`).digest('hex');
}

async function sendOtp(phone) {
  const code = (Math.floor(100000 + Math.random() * 900000)).toString();
  const codeHash = hashOtp(phone, code);
  const expiresAt = new Date(Date.now() + DEFAULT_TTL_MS);

  // store in DB
  await OtpCode.create({ phone, codeHash, expiresAt });

  // send via provider if configured (Twilio)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
    try {
      const Twilio = require('twilio');
      const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.messages.create({ body: `Your verification code is ${code}`, from: process.env.TWILIO_FROM_NUMBER, to: phone });
    } catch (e) {
      console.error('Twilio send error', e);
      // fallback to console
      console.log(`OTP for ${phone}: ${code}`);
    }
  } else {
    // fallback: log to console (dev)
    console.log(`OTP for ${phone}: ${code}`);
  }

  return { ok: true, expiresAt };
}

async function verifyOtp(phone, code, ip) {
  const now = new Date();
  const codeHash = hashOtp(phone, code);

  // Find latest non-expired OTP for this phone
  const otp = await OtpCode.findOne({ where: { phone }, order: [['createdAt', 'DESC']] });
  if (!otp) return { ok: false, reason: 'invalid' };
  if (otp.expiresAt < now) return { ok: false, reason: 'expired' };

  // Check attempts
  if (otp.attempts >= MAX_VERIFY_ATTEMPTS) {
    await otp.destroy();
    return { ok: false, reason: 'too_many_attempts' };
  }

  // Verify
  if (otp.codeHash !== codeHash) {
    otp.attempts = otp.attempts + 1;
    await otp.save();
    if (otp.attempts >= MAX_VERIFY_ATTEMPTS) {
      await otp.destroy();
      return { ok: false, reason: 'too_many_attempts' };
    }
    return { ok: false, reason: 'invalid' };
  }

  // Valid — consume record
  await otp.destroy();

  return { ok: true };
}

async function markUserPhoneVerifiedIfAuthenticated(req, phone) {
  try {
    const authHeader = req.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return;
    const token = authHeader.replace(/^Bearer\s+/, '');
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-jwt-secret');
    if (payload && payload.sub) {
      const user = await User.findByPk(payload.sub);
      if (user) {
        await user.update({ phoneVerified: true });
      }
    }
  } catch (e) {
    console.warn('markUserPhoneVerifiedIfAuthenticated: failed to mark user', e.message);
  }
}

module.exports = { sendOtp, verifyOtp, markUserPhoneVerifiedIfAuthenticated };
