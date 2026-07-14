const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const { sequelize } = require('./src/models');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
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

// Database sync and start server
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🗄️  Database connected`);
    console.log(`🔌 WebSocket ready`);
  });
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

module.exports = { app, io };
