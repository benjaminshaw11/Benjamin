const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { writeAudit } = require('../lib/audit/logger');
const adminAuth = require('../middleware/adminAuth');
const { credit } = require('../lib/wallet');
const { getIo } = require('../lib/socket');

// Helper: create a pending manual transaction
router.post('/submit', async (req, res) => {
  try {
    const { user_id, amount_paise, method, provider_txn_id, payer_vpa, payer_account } = req.body;
    if (!user_id || !amount_paise || !method || !provider_txn_id) {
      return res.status(400).json({ error: 'user_id, amount_paise, method and provider_txn_id required' });
    }
    // Prevent duplicate provider_txn_id submissions
    const [dup] = await sequelize.query('SELECT id FROM transactions WHERE provider_payment_id = $1 LIMIT 1', { bind: [provider_txn_id] });
    if (dup && dup.length) {
      return res.status(409).json({ error: 'This transaction id has already been submitted', existing_tx_id: dup[0].id });
    }

    const [result] = await sequelize.query(
      `INSERT INTO transactions ("id","user_id","provider","provider_payment_id","amount","currency","method","type","status","metadata","created_at","updated_at")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'pending_manual', $8::jsonb, now(), now())
       RETURNING id`,
      { bind: [user_id, 'manual', provider_txn_id, amount_paise, 'INR', method, 'deposit', JSON.stringify({ payer_vpa, payer_account })] }
    );
    const txId = result && result[0] && result[0].id ? result[0].id : null;
    await writeAudit({ entityType: 'transaction', entityId: txId, action: 'manual_deposit_submitted', data: { user_id, amount_paise, method, provider_txn_id } });
    return res.status(201).json({ tx_id: txId, status: 'pending_manual', message: 'Manual deposit submitted. Pending verification.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Status endpoint (for polling/fallback)
router.get('/status/:txId', async (req, res) => {
  try {
    const txId = req.params.txId;
    const [rows] = await sequelize.query('SELECT id as tx_id, status, amount, currency, created_at FROM transactions WHERE id = $1 LIMIT 1', { bind: [txId] });
    if (!rows || !rows.length) return res.status(404).json({ error: 'Not found' });
    const tx = rows[0];
    return res.json({ tx_id: tx.tx_id, status: tx.status, amount: tx.amount, currency: tx.currency, created_at: tx.created_at });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: list pending manual deposits (protected)
router.get('/admin/pending', adminAuth, async (req, res) => {
  try {
    const [rows] = await sequelize.query(
      `SELECT id, user_id, provider_payment_id, amount, currency, metadata, created_at
       FROM transactions WHERE status = 'pending_manual' ORDER BY created_at ASC LIMIT 200`
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: approve (protected) - credits wallet atomically and emits socket update
router.post('/admin/:id/approve', adminAuth, async (req, res) => {
  try {
    const txId = req.params.id;
    const adminId = req.user && (req.user.userId || req.user.id || req.user.sub) ? (req.user.userId || req.user.id || req.user.sub) : req.body.admin_id;
    const matched_bank_txn_id = req.body.matched_bank_txn_id || null;

    // Fetch transaction details
    const [txRows] = await sequelize.query('SELECT id, user_id, amount, status FROM transactions WHERE id = $1 LIMIT 1', { bind: [txId] });
    if (!txRows || !txRows.length) return res.status(404).json({ error: 'Transaction not found' });
    const tx = txRows[0];
    if (tx.status === 'confirmed') return res.json({ message: 'Already confirmed' });

    // Idempotency: check if wallet transaction already exists for this reference
    const [existing] = await sequelize.query('SELECT id FROM wallet_transactions WHERE reference_tx = $1 LIMIT 1', { bind: [txId] });
    if (existing && existing.length) {
      await sequelize.query('UPDATE transactions SET status = $1, verified_by = $2, verified_at = now(), provider_payment_id = COALESCE(provider_payment_id, $3), updated_at = now() WHERE id = $4', { bind: ['confirmed', adminId, matched_bank_txn_id, txId] });
      await writeAudit({ entityType: 'transaction', entityId: txId, action: 'manual_deposit_approved_idempotent', actorId: adminId, data: { matched_bank_txn_id } });

      // emit socket update
      try {
        const io = getIo();
        io.to(`user-${tx.user_id}`).emit('transaction:update', { tx_id: txId, status: 'confirmed', amount: tx.amount, message: 'Your deposit has been confirmed and credited.' });
      } catch (e) {
        console.warn('Socket emit failed', e.message);
      }

      return res.json({ message: 'Already credited previously; transaction marked confirmed.' });
    }

    // Credit wallet
    const creditResult = await credit(tx.user_id, tx.amount, txId, { reason: 'manual_deposit_approved' });
    if (creditResult && creditResult.alreadyCredited) {
      await sequelize.query('UPDATE transactions SET status = $1, verified_by = $2, verified_at = now(), provider_payment_id = COALESCE(provider_payment_id, $3), updated_at = now() WHERE id = $4', { bind: ['confirmed', adminId, matched_bank_txn_id, txId] });
      await writeAudit({ entityType: 'transaction', entityId: txId, action: 'manual_deposit_approved_idempotent', actorId: adminId, data: { matched_bank_txn_id } });

      try {
        const io = getIo();
        io.to(`user-${tx.user_id}`).emit('transaction:update', { tx_id: txId, status: 'confirmed', amount: tx.amount, message: 'Your deposit has been confirmed and credited.' });
      } catch (e) {
        console.warn('Socket emit failed', e.message);
      }

      return res.json({ message: 'Already credited previously; transaction marked confirmed.' });
    }

    // Update transaction record
    await sequelize.query('UPDATE transactions SET status = $1, verified_by = $2, verified_at = now(), provider_payment_id = COALESCE(provider_payment_id, $3), updated_at = now() WHERE id = $4', { bind: ['confirmed', adminId, matched_bank_txn_id, txId] });

    await writeAudit({ entityType: 'transaction', entityId: txId, action: 'manual_deposit_approved', actorId: adminId, data: { matched_bank_txn_id } });

    // emit socket update to user
    try {
      const io = getIo();
      io.to(`user-${tx.user_id}`).emit('transaction:update', { tx_id: txId, status: 'confirmed', amount: tx.amount, message: 'Your deposit has been confirmed and credited.' });
    } catch (e) {
      console.warn('Socket emit failed', e.message);
    }

    return res.json({ message: 'Approved and wallet credited.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: reject (protected)
router.post('/admin/:id/reject', adminAuth, async (req, res) => {
  try {
    const txId = req.params.id;
    const adminId = req.user && (req.user.userId || req.user.id || req.user.sub) ? (req.user.userId || req.user.id || req.user.sub) : req.body.admin_id;
    const reason = req.body.reason || null;
    await sequelize.query(
      `UPDATE transactions SET status = 'rejected', verified_by = $1, verified_at = now(), metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, updated_at = now()
       WHERE id = $3`,
      { bind: [adminId, JSON.stringify({ manual_reject_reason: reason }), txId] }
    );
    await writeAudit({ entityType: 'transaction', entityId: txId, action: 'manual_deposit_rejected', actorId: adminId, data: { reason } });

    // emit socket update to user
    try {
      const txRows = await sequelize.query('SELECT user_id, amount FROM transactions WHERE id = $1 LIMIT 1', { bind: [txId] });
      const tx = txRows[0] && txRows[0][0] ? txRows[0][0] : null;
      if (tx) {
        const io = getIo();
        io.to(`user-${tx.user_id}`).emit('transaction:update', { tx_id: txId, status: 'rejected', amount: tx.amount, message: 'Your deposit could not be verified and was rejected.' });
      }
    } catch (e) {
      console.warn('Socket emit failed', e.message);
    }

    return res.json({ message: 'Rejected' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
