const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sequelize } = require('../models');

const ACCESS_TOKEN_EXP = process.env.ACCESS_TOKEN_EXP || '15m';
const REFRESH_TOKEN_EXP_DAYS = parseInt(process.env.REFRESH_TOKEN_EXP_DAYS || '30', 10);

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXP });
}

async function createAndStoreRefreshToken(userId) {
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXP_DAYS * 24 * 60 * 60 * 1000);

  await sequelize.query(
    'INSERT INTO refresh_tokens ("id","user_id","token_hash","expires_at","revoked","created_at") VALUES (gen_random_uuid(), $1, $2, $3, false, now())',
    { bind: [userId, tokenHash, expiresAt.toISOString()] }
  );

  return { refreshToken, expiresAt };
}

async function revokeRefreshTokenByHash(tokenHash) {
  await sequelize.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', { bind: [tokenHash] });
}

async function findValidRefreshToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const [rows] = await sequelize.query('SELECT id, user_id, expires_at, revoked FROM refresh_tokens WHERE token_hash = $1 LIMIT 1', { bind: [tokenHash] });
  if (!rows || !rows.length) return null;
  const rt = rows[0];
  if (rt.revoked) return null;
  const now = new Date();
  if (new Date(rt.expires_at) < now) return null;
  return rt;
}

module.exports = { signAccessToken, createAndStoreRefreshToken, revokeRefreshTokenByHash, findValidRefreshToken };
