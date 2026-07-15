const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const { sequelize } = require('./src/models');
const applySecurity = require('./src/middleware/security');
const webhooksRouter = require('./src/routes/webhooks');
const manualDepositsRouter = require('./src/routes/manualDeposits');

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

applySecurity(app);

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/webhooks', webhooksRouter);
app.use('/api/manual-deposits', manualDepositsRouter);

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/games', require('./src/routes/games'));
app.use('/api/wallet', require('./src/routes/wallet'));
app.use('/api/sports', require('./src/routes/sports'));
app.use('/api/admin', require('./src/routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

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