// Centralized error handler for Express
module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const response = {
    error: true,
    message: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  // Log the error (stdout/stderr aggregated by most hosts)
  console.error(err);

  res.status(status).json(response);
};
