/**
 * audit/logger.js
 * Append-only audit logger writing to DB (audit_logs table).
 * Computes a simple chain hash to help detect tampering.
 */
const { sequelize } = require('../../src/models') || require('../models'); // try both paths
const crypto = require('crypto');

async function writeAudit({ entityType, entityId, action, actorId = null, data = {} }) {
  // Attempt to fetch previous hash; fallback if query fails
  let prevHash = null;
  try {
    const prev = await sequelize.query('SELECT row_hash FROM audit_logs ORDER BY occurred_at DESC LIMIT 1', { type: sequelize.QueryTypes.SELECT });
    if (prev && prev[0] && prev[0].row_hash) prevHash = prev[0].row_hash;
  } catch (e) {
    // table may not exist yet (e.g., in initial bootstrap)
    prevHash = null;
  }

  const payload = JSON.stringify({ entityType, entityId, action, actorId, data, timestamp: new Date().toISOString() });
  const row_hash = crypto.createHash('sha256').update((prevHash || '') + payload).digest('hex');

  try {
    await sequelize.query(
      'INSERT INTO audit_logs ("id","entity_type","entity_id","action","actor_id","data","occurred_at","row_hash") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, now(), $6)',
      { bind: [entityType, entityId, action, actorId, JSON.stringify(data), row_hash] }
    );
  } catch (err) {
    // If insertion fails (e.g., migrations not run), log locally
    console.warn('Failed to write to audit_logs table:', err.message);
  }

  return { row_hash };
}

module.exports = { writeAudit };
