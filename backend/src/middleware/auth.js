// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { UserSession } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const session = await UserSession.findOne({
      where: {
        sessionToken: token,
        isActive: true
      }
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    req.userId = decoded.userId;
    req.sessionId = session.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed', message: error.message });
  }
};

module.exports = authMiddleware;
