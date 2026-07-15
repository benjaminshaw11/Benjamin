/**
 * validateEnv.js
 * Fail-fast if required environment variables are missing.
 */
const required = [
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'JWT_SECRET',
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

function validateEnv() {
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
  console.log('Env validation passed');
}

module.exports = validateEnv;
