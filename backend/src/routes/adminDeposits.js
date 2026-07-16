const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const adminAuth = require('../middleware/adminAuth');

// GET /api/admin/deposits/pending?q=&limit=&offset=
router.get('/pending', adminAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
    const offset = parseInt(req.query.offset || '0', 10) || 0;

    let whereClause = "t.status = 'pending_manual'";
    const binds = [];
    if (q) {
      binds.push(`%${q}%`);
      binds.push(`%${q}%`);
      whereClause += ` AND (t.provider_payment_id ILIKE $${binds.length-1} OR u.email ILIKE $${binds.length})`;
    }

    const sql = `SELECT t.id, t.user_id, u.email as user_email, t.provider_payment_id, t.amount, t.currency, t.metadata, t.created_at
                 FROM transactions t
                 LEFT JOIN users u ON u.id = t.user_id
                 WHERE ${whereClause}
                 ORDER BY t.created_at ASC
                 LIMIT $${binds.length+1} OFFSET $${binds.length+2}`;
    binds.push(limit);
    binds.push(offset);

    const [rows] = await sequelize.query(sql, { bind: binds });

    // count
    let countSql = `SELECT count(1) as total FROM transactions t LEFT JOIN users u ON u.id = t.user_id WHERE ${whereClause}`;
    const [countRows] = await sequelize.query(countSql, { bind: binds.slice(0, binds.length-2) });
    const total = countRows && countRows[0] && countRows[0].total ? parseInt(countRows[0].total, 10) : 0;

    return res.json({ total, limit, offset, rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
