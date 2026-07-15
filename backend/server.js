const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { sequelize } = require('./src/models');
const applySecurity = require('./src/middleware/security');
const webhooksRouter = require('./src/routes/webhooks');
const manualDepositsRouter = require('./src/routes/manualDeposits');
const authTokensRouter = require('./src/routes/authTokens');
const authProdRouter = require('./src/routes/authProd');
const { init } = require('./src/lib/socket');

dotenv.config();

try {
  require('./src/config/validateEnv')();
} catch (e) {
  console.error('Env validation failed', e);
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// initialize socket helper
init(io);

applySecurity(app);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/webhooks', webhooksRouter);
app.use('/api/manual-deposits', manualDepositsRouter);
// Mount auth routes: token endpoints and production login
app.use('/api/auth', authTokensRouter);
app.use('/api/auth', authProdRouter);

app.use('/api/games', require('./src/routes/games'));
app.use('/api/wallet', require('./src/routes/wallet'));
app.use('/api/sports', require('./src/routes/sports'));
app.use('/api/admin', require('./src/routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('auth', ({ token }) => {
    try {
      if (!token) return;
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const userId = payload && (payload.userId || payload.sub || payload.id);
      if (userId) {
        socket.join(`user-${userId}`);
        console.log('Socket', socket.id, 'joined room user-' + userId);
      }
    } catch (e) {
      console.warn('Socket auth failed', e.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log('🗄️  Database connected');
    console.log('🔌 WebSocket ready');
  });
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

module.exports = { app, io };