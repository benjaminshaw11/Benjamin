/**
 * wallet.js
 * Simple wallet credit helper that creates wallet_transactions and increments users.balance atomically.
 */
const { sequelize } = require('../models');

async function credit(userId, amountPaise, referenceTx = null, metadata = {}) {
  if (!userId) throw new Error('userId required');
  if (!amountPaise || Number(amountPaise) <= 0) throw new Error('amountPaise must be > 0');

  // Use a DB transaction to ensure atomicity and idempotency check
  const t = await sequelize.transaction();
  try {
    // Check idempotency: if a wallet_transactions with same reference_tx exists, do not double credit
    if (referenceTx) {
      const [existing] = await sequelize.query('SELECT id FROM wallet_transactions WHERE reference_tx = $1 LIMIT 1', { bind: [referenceTx], transaction: t });
      if (existing && existing.length) {
        await t.rollback();
        return { alreadyCredited: true };
      }
    }

    // Insert wallet transaction
    await sequelize.query(
      'INSERT INTO wallet_transactions ("id","user_id","amount","currency","type","reference_tx","metadata","created_at") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6::jsonb, now())',
      { bind: [userId, amountPaise, 'INR', 'credit', referenceTx, JSON.stringify(metadata)], transaction: t }
    );

    // Update user's balance (assumes users.balance exists)
    await sequelize.query('UPDATE users SET balance = COALESCE(balance,0) + $1 WHERE id = $2', { bind: [amountPaise, userId], transaction: t });

    await t.commit();
    return { alreadyCredited: false };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

module.exports = { credit };
