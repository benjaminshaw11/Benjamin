// Simple in-memory rate limiter for dev; use Redis in production
const LRU = require('lru-cache');

const defaultOptions = {
  windowMs: 60 * 1000, // 1 minute
  max: 5 // max requests per window
};

const caches = new Map();

function getCache(key, options) {
  const k = JSON.stringify(options || defaultOptions);
  if (!caches.has(k)) caches.set(k, new LRU({ max: 5000, ttl: options.windowMs || defaultOptions.windowMs }));
  return caches.get(k);
}

function rateLimit(opts = {}) {
  const options = { ...defaultOptions, ...opts };
  const cache = getCache('default', options);

  return (req, res, next) => {
    try {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const key = options.keyGetter ? options.keyGetter(req) : ip;
      const cur = cache.get(key) || 0;
      if (cur >= options.max) {
        res.status(429).json({ error: 'Too many requests' });
        return;
      }
      cache.set(key, cur + 1);
      next();
    } catch (e) {
      next();
    }
  };
}

module.exports = rateLimit;
