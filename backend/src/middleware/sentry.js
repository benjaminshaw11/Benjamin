const Sentry = require('@sentry/node');

function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) : 0.0,
    });
  }
}

function requestHandler() {
  if (process.env.SENTRY_DSN) return Sentry.Handlers.requestHandler();
  // noop middleware when Sentry is not configured
  return (req, res, next) => next();
}

function errorHandler() {
  if (process.env.SENTRY_DSN) return Sentry.Handlers.errorHandler();
  // noop error handler passthrough
  return (err, req, res, next) => next(err);
}

module.exports = { initSentry, requestHandler, errorHandler };
