/**
 * reconcilePayments.js
 * Simple reconciliation job stub.
 */
const { sequelize } = require('../models');

async function run() {
  console.log('Starting reconciliation job');
  const [txs] = await sequelize.query("SELECT provider_payment_id, amount, status FROM transactions WHERE (status ILIKE '%captured%' OR status ILIKE 'success') AND reconciled_at IS NULL LIMIT 200");
  console.log(`Found ${txs.length} completed transactions not marked reconciled`);
  for (const t of txs) {
    await sequelize.query('UPDATE transactions SET reconciled_at = now() WHERE provider_payment_id = $1', { bind: [t.provider_payment_id] });
    console.log('Marked reconciled:', t.provider_payment_id);
  }
  console.log('Reconciliation job done');
}

if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { run };
