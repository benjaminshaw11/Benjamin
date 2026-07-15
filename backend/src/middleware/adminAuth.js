const jwt = require('jsonwebtoken');

module.exports = function adminAuth(req, res, next) {
  const auth = req.headers.authorization || req.headers.Authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Expect payload to have isAdmin or role
    if (!payload || (!payload.isAdmin && payload.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden: admin role required' });
    }
    req.user = payload; // include admin id in payload (e.g., userId)
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
