// Simple in-memory OTP service - replace with SMS provider in prod
const crypto = require('crypto');

const store = new Map(); // key: phone, value: { code, expiresAt }

function generateCode() {
  return ('' + Math.floor(100000 + Math.random() * 900000));
}

function sendOtp(phone) {
  const code = generateCode();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  store.set(phone, { code, expiresAt });
  // TODO: hook to real SMS provider (Twilio/MSG91) - for now log
  console.log(`OTP for ${phone}: ${code}`);
  return true;
}

function verifyOtp(phone, code) {
  const rec = store.get(phone);
  if (!rec) return false;
  if (Date.now() > rec.expiresAt) {
    store.delete(phone);
    return false;
  }
  if (rec.code !== String(code)) return false;
  store.delete(phone);
  return true;
}

module.exports = { sendOtp, verifyOtp };
