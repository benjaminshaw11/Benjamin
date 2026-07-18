const express = require('express');
const router = express.Router();
const razorpay = require('../../services/payments/razorpay');
const { Transaction, Wallet, User, sequelize } = require('../../models');

// IMPORTANT: This route must use raw body parsing in the app:
// app.use('/webhooks/razorpay', express.raw({ type: 'application/json' }), require('./webhooks/razorpay'))

router.post('/', async (req, res) => {
  try {
    const rawBody = req.body; // when using express.raw this is a Buffer
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    if (!razorpay.verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    const event = payload.event;

    // Handle payment captured events (deposits)
    if (event === 'payment.captured' || event === 'payment.authorized' || event === 'order.paid') {
      // Try to extract an order/receipt reference that maps to your Transaction.reference
      const payment = payload.payload.payment ? payload.payload.payment.entity : (payload.payload.order ? payload.payload.order.entity : null);
      const orderId = payment && (payment.order_id || payment.entity_id || payment.receipt);
      const paymentId = payment && (payment.id || payment.payment_id);

      // Prefer mapping by order_id or by payment notes/receipt depending on your implementation
      // Here we attempt to find Transaction by reference === orderId or provider id

      // Processing idempotently inside a DB transaction
      await sequelize.transaction(async (t) => {
        let txn = null;
        if (orderId) {
          txn = await Transaction.findOne({ where: { reference: orderId }, transaction: t, lock: t.LOCK.UPDATE });
        }
        if (!txn && paymentId) {
          txn = await Transaction.findOne({ where: { provider_tx_id: paymentId }, transaction: t, lock: t.LOCK.UPDATE });
        }
        if (!txn) {
          // Could not map to a transaction — log for reconciliation and return 202
          console.warn('Razorpay webhook: transaction not found for', orderId || paymentId);
          return;
        }

        // Idempotency: only apply if pending
        if (txn.status && txn.status !== 'pending') {
          // already processed
          return;
        }

        // Mark transaction completed and store provider data
        txn.status = 'completed';
        txn.provider = 'razorpay';
        txn.provider_tx_id = paymentId || null;
        txn.meta = Object.assign({}, txn.meta || {}, { razorpay_event: payload });
        await txn.save({ transaction: t });

        // Credit wallet using the transaction.userId (not req.user)
        const wallet = await Wallet.findOne({ where: { userId: txn.userId }, transaction: t, lock: t.LOCK.UPDATE });
        if (!wallet) throw new Error('Wallet not found for user ' + txn.userId);

        // Use DB decimal arithmetic where possible; here we assume txn.amount is in DB decimal (e.g., rupees)
        const newBalance = (parseFloat(wallet.balance || 0) + parseFloat(txn.amount || 0)).toFixed(2);
        wallet.balance = newBalance;
        await wallet.save({ transaction: t });

        // Update user totals
        const user = await User.findByPk(txn.userId, { transaction: t });
        if (user) {
          user.totalDeposits = (parseFloat(user.totalDeposits || 0) + parseFloat(txn.amount || 0)).toFixed(2);
          await user.save({ transaction: t });
        }

        // done
      });
    }

    // Acknowledge receipt
    res.json({ ok: true });
  } catch (err) {
    console.error('Error processing Razorpay webhook', err);
    // Return 200/202 to avoid retries if you decide to log and process later, but 500 will cause retries
    res.status(500).json({ error: 'internal' });
  }
});

module.exports = router;
