const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { writeAudit } = require('../lib/audit/logger');

// Helper: create a pending manual transaction
router.post('/submit', async (req, res) => {
  try {
    const { user_id, amount_paise, method, provider_txn_id, payer_vpa, payer_account } = req.body;
    if (!user_id || !amount_paise || !method || !provider_txn_id) {
      return res.status(400).json({ error: 'user_id, amount_paise, method and provider_txn_id required' });
    }
    const [result] = await sequelize.query(
      `INSERT INTO transactions ("id","user_id","provider","provider_payment_id","amount","currency","method","type","status","metadata","created_at","updated_at")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'pending_manual', $8::jsonb, now(), now())
       RETURNING id`,
      { bind: [user_id, 'manual', provider_txn_id, amount_paise, 'INR', method, 'deposit', JSON.stringify({ payer_vpa, payer_account })] }
    );
    const txId = result && result[0] && result[0].id ? result[0].id : null;
    await writeAudit({ entityType: 'transaction', entityId: txId, action: 'manual_deposit_submitted', data: { user_id, amount_paise, method, provider_txn_id } });
    return res.status(201).json({ tx_id: txId, message: 'Manual deposit submitted. Pending verification.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: list pending manual deposits
router.get('/admin/pending', async (req, res) => {
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

// Admin: approve
router.post('/admin/:id/approve', async (req, res) => {
  try {
    const txId = req.params.id;
    const adminId = req.body.admin_id; // ensure admin auth in real code
    const matched_bank_txn_id = req.body.matched_bank_txn_id || null;
    await sequelize.query(
      `UPDATE transactions SET status = 'confirmed', verified_by = $1, verified_at = now(), provider_payment_id = COALESCE(provider_payment_id, $2), updated_at = now()
       WHERE id = $3`,
      { bind: [adminId, matched_bank_txn_id, txId] }
    );
    await writeAudit({ entityType: 'transaction', entityId: txId, action: 'manual_deposit_approved', actorId: adminId, data: { matched_bank_txn_id } });
    // TODO: credit user wallet via your wallet service (call internal service or create wallet transaction)
    return res.json({ message: 'Approved and credited (please ensure wallet crediting is performed).' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin: reject
router.post('/admin/:id/reject', async (req, res) => {
  try {
    const txId = req.params.id;
    const adminId = req.body.admin_id;
    const reason = req.body.reason || null;
    await sequelize.query(
      `UPDATE transactions SET status = 'rejected', verified_by = $1, verified_at = now(), metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, updated_at = now()
       WHERE id = $3`,
      { bind: [adminId, JSON.stringify({ manual_reject_reason: reason }), txId] }
    );
    await writeAudit({ entityType: 'transaction', entityId: txId, action: 'manual_deposit_rejected', actorId: adminId, data: { reason } });
    return res.json({ message: 'Rejected' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
