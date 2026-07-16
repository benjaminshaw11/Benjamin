const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const { sequelize } = require('./src/models');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Security middlewares
const { applySecurity } = require('./src/middleware/security');
applySecurity(app);

// Sentry (optional)
const { initSentry, requestHandler: sentryRequestHandler, errorHandler: sentryErrorHandler } = require('./src/middleware/sentry');
initSentry();
app.use(sentryRequestHandler());

// Request logging
const requestLogger = require('./src/middleware/requestLogger');
app.use(requestLogger);

// API docs (Swagger)
app.use('/api/docs', require('./docs/swagger'));

const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/games', require('./src/routes/games'));
app.use('/api/wallet', require('./src/routes/wallet'));
app.use('/api/sports', require('./src/routes/sports'));
app.use('/api/admin', require('./src/routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Metrics (Prometheus)
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// WebSocket events
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-game', (gameId) => {
    socket.join(`game-${gameId}`);
  });

  socket.on('place-bet', (data) => {
    io.to(`game-${data.gameId}`).emit('bet-placed', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Sentry error handler (if enabled)
app.use(sentryErrorHandler());

// Centralized error handler
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

// Database sync and start server only when run directly
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.sync({ alter: true });
    server.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🗄️  Database connected`);
      console.log(`🔌 WebSocket ready`);
    });
  } catch (err) {
    console.error('Database connection error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  // Only start server if this file is run directly (node server.js)
  startServer();
}

module.exports = { app, io, startServer };
