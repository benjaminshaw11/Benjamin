/**
 * security.js
 * Apply common security middlewares (helmet, rate-limit, cors, body-size limit).
 */
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

module.exports = function applySecurity(app) {
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
  }));

  // Basic rate limiter -- tune in production (nginx/WAF recommended)
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);

  // Body size limit enforced via express.json default in server.js
  // We keep this file minimal; more policies can be added here.
};
