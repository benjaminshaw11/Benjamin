// backend/src/utils/jwt.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class JWTService {
  generateAccessToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  verifyToken(token, isRefresh = false) {
    try {
      const secret = isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET;
      return jwt.verify(token, secret);
    } catch (error) {
      return null;
    }
  }
}

module.exports = new JWTService();
