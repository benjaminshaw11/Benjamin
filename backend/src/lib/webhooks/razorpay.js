/**
 * razorpay.js
 * Verify Razorpay webhook signatures and provide helper to extract event.
 */
const crypto = require('crypto');

function verifyWebhookSignature(bodyRaw, signature, webhookSecret) {
  // bodyRaw must be exact raw body string or Buffer
  const expected = crypto.createHmac('sha256', webhookSecret).update(bodyRaw).digest('hex');
  return expected === signature;
}

module.exports = {
  verifyWebhookSignature
};
