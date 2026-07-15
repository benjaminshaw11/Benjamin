/**
 * webhooks.js
 * Route to receive provider webhooks (Razorpay).
 */
const express = require('express');
const router = express.Router();
const { verifyWebhookSignature } = require('../lib/webhooks/razorpay');
const { sequelize } = require('../models');
const { writeAudit } = require('../lib/audit/logger');

// Use express.raw on this specific route to preserve raw body for signature verification
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  const bodyRaw = req.body;
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  try {
    if (!signature || !webhookSecret) {
      console.warn('Webhook missing signature or secret not configured');
      return res.status(400).send('Bad Request');
    }
    const valid = verifyWebhookSignature(bodyRaw, signature, webhookSecret);
    const parsed = JSON.parse(bodyRaw.toString('utf8'));

    const eventId = parsed && parsed.id ? parsed.id : (parsed && parsed.event) ? parsed.event : null;
    await sequelize.query(
      'INSERT INTO raw_webhooks ("id","provider","event_id","raw_payload","signature_verified","received_at") VALUES (gen_random_uuid(), $1, $2, $3::jsonb, $4, now()) ON CONFLICT (provider,event_id) DO NOTHING',
      { bind: ['razorpay', eventId, JSON.stringify(parsed), valid] }
    );

    if (!valid) {
      await writeAudit({ entityType: 'webhook', entityId: eventId, action: 'webhook_signature_invalid', data: parsed });
      return res.status(400).send('Invalid signature');
    }

    const event = parsed.event || '';
    const payment = parsed.payload && parsed.payload.payment && parsed.payload.payment.entity;
    if (['payment.captured', 'payment.authorized', 'payment.failed', 'payment.refunded'].includes(event)) {
      const providerId = payment && payment.id;
      const amount = payment && payment.amount; // paise
      const status = payment && payment.status;

      await sequelize.query(
        `INSERT INTO transactions ("id","user_id","provider","provider_payment_id","amount","currency","type","status","metadata","created_at","updated_at")
         VALUES (gen_random_uuid(), NULL, $1, $2, $3, $4, $5, $6, $7::jsonb, now(), now())
         ON CONFLICT (provider, provider_payment_id) DO UPDATE SET status = EXCLUDED.status, updated_at = now()`,
        { bind: ['razorpay', providerId, amount, 'INR', 'deposit', status, JSON.stringify(parsed)] }
      );

      await writeAudit({ entityType: 'transaction', entityId: providerId, action: `webhook_${event}`, data: parsed });
    } else {
      await writeAudit({ entityType: 'webhook', entityId: eventId, action: `webhook_${event || 'unknown'}`, data: parsed });
    }

    return res.status(200).send('ok');
  } catch (err) {
    console.error('Webhook processing error', err);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
