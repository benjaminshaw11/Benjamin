const expressPino = require('express-pino-logger');
const logger = require('../utils/logger');

module.exports = expressPino({ logger });
