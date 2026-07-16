const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cors = require('cors');

function applySecurity(app) {
  // Basic security headers
  app.use(helmet());

  // CORS - restrict to FRONTEND_URL if provided
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173';
  app.use(
    cors({
      origin,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    })
  );

  // Prevent XSS attacks
  app.use(xss());

  // Prevent NoSQL/Operator injection (useful if any DB NoSQL usage)
  app.use(mongoSanitize());

  // Protect against HTTP Parameter Pollution
  app.use(hpp());

  // Basic rate limiting
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
}

module.exports = { applySecurity };
