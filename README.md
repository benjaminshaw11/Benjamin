# 🎰 Full-Stack Betting Platform

A complete betting platform with **Casinos**, **Sports Betting**, **Virtual Games**, **Prediction Markets**, and **INR Payments**.

## Features

### 🎮 Gaming Products
- **Casinos**: Dice, Roulette, Blackjack, Slots
- **Sports Betting**: Live odds, Pre-match betting, Multiple markets
- **Virtual Games**: Crash, Mines, Plinko, Color Prediction
- **Prediction Markets**: Binary YES/NO event betting

### 💰 Payments & Wallet
- Razorpay integration for INR deposits/withdrawals
- Real money only (no demo)
- Instant settlement
- Transaction history

### 🔐 Security & Compliance
- JWT authentication
- Provably fair RNG for games
- KYC verification ready
- Admin dashboard & risk management
- Responsible gambling features

### 🚀 Technology Stack
- **Backend**: Node.js, Express, PostgreSQL, WebSocket
- **Frontend**: React, TypeScript, TailwindCSS
- **Real-time**: Socket.io for live updates
- **Payment**: Razorpay API
- **Database**: PostgreSQL with Sequelize ORM

## Project Structure

```
betting-platform/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/    # Game logic, betting
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, validation
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helpers, RNG
│   │   └── config/         # Database, Razorpay
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API calls
│   │   ├── store/         # State management
│   │   ├── styles/        # Global styles
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml     # Docker setup
└── docs/                  # Documentation

```

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/benjaminshaw11/Benjamin.git
cd Benjamin

# Backend setup
cd backend
npm install
cp .env.example .env
# Update .env with your Razorpay keys and DB credentials
npm run migrate
npm start

# Frontend setup (in new terminal)
cd frontend
npm install
npm run dev
```

### Docker Setup
```bash
docker-compose up -d
```

## API Documentation

Base URL: `http://localhost:5000/api`

### Authentication
- POST `/auth/register` - User registration
- POST `/auth/login` - User login
- POST `/auth/refresh` - Refresh token

### Games
- GET `/games` - List available games
- POST `/games/:gameId/bet` - Place a bet
- GET `/games/:gameId/history` - Bet history

### Wallet
- GET `/wallet/balance` - Get balance
- POST `/wallet/deposit` - Initiate deposit
- POST `/wallet/withdraw` - Request withdrawal
- GET `/wallet/transactions` - Transaction history

### Sports Betting
- GET `/sports/odds` - Get live odds
- POST `/sports/bet` - Place sports bet
- GET `/sports/markets` - Available markets

### Admin
- GET `/admin/dashboard` - Dashboard stats
- GET `/admin/users` - User management
- POST `/admin/games/odds` - Update odds

## Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=betting_platform
DB_USER=postgres
DB_PASSWORD=your_password

# Razorpay
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=7d

# Redis
REDIS_URL=redis://localhost:6379
```

## Game Fair Play Rules

### House Edge Configuration
- Dice: 5%
- Roulette: 2.7%
- Slots: 8%
- Crash: 3%
- Color Prediction: 5%

### Provably Fair System
- Seed-based RNG for verifiable results
- Client seed combination
- Server seed hash verification
- Transparent calculation

## Deployment

### Heroku
```bash
git push heroku main
```

### AWS/DigitalOcean
See `docs/deployment.md`

## Legal Notice

⚠️ **Important**: This platform requires:
- Gaming license (varies by jurisdiction)
- Compliance with local gambling laws
- AML/KYC procedures
- Responsible gambling features
- Data protection compliance (GDPR, etc.)

Consult legal professionals before deployment.

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE.md

## Support

For issues and questions:
- GitHub Issues: https://github.com/benjaminshaw11/Benjamin/issues
- Email: support@bettingplatform.com

---

**Built with ❤️ for next-gen betting platforms**
