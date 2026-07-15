# 🎰 Benjamin - Full-Stack Betting Platform

A complete betting platform with **Casinos**, **Sports Betting**, **Virtual Games**, **Prediction Markets**, and **INR Payments**. Also includes a bonus **To-Do List Application** with local storage.

## 📑 Table of Contents
- [Features](#features)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [To-Do List App](#to-do-list-app)
- [Documentation](#documentation)
- [Environment Variables](#environment-variables)
- [Game Fair Play Rules](#game-fair-play-rules)
- [Deployment](#deployment)
- [Legal Notice](#legal-notice)
- [Contributing](#contributing)

---

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

---

## Project Structure

```
Benjamin/
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
├── todo-app/               # 📋 To-Do List Application
│   ├── index.html         # Main HTML file
│   ├── styles.css         # Styling
│   ├── app.js             # JavaScript logic
│   └── README.md          # To-Do app documentation
├── docs/                  # 📚 Complete Documentation
│   ├── API.md             # 21+ API endpoints with examples
│   ├── CURL_EXAMPLES.md   # Ready-to-use cURL commands
│   ├── JAVASCRIPT_EXAMPLES.md  # Frontend integration code
│   ├── GAME_FLOW_DIAGRAMS.md   # ASCII flowcharts & walkthroughs
│   ├── TESTING_GUIDE.md        # Testing & fairness verification
│   └── ERROR_HANDLING.md       # Common errors & solutions
├── docker-compose.yml     # Docker setup
└── README.md             # This file
```

---

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL
- Git
- Docker (optional)

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

# To-Do List App (open in browser)
open todo-app/index.html
```

### Docker Setup
```bash
docker-compose up -d
```

---

## API Documentation

**Base URL**: `http://localhost:5000/api`

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh token

### Games Endpoints
- `GET /games` - List available games
- `GET /games/:gameId` - Get game details
- `POST /games/:gameId/bet` - Place a bet
- `GET /games/:gameId/history` - Bet history

### Wallet Endpoints
- `GET /wallet/balance` - Get balance
- `POST /wallet/deposit` - Initiate deposit
- `POST /wallet/verify-deposit` - Verify deposit
- `POST /wallet/withdraw` - Request withdrawal
- `GET /wallet/transactions` - Transaction history

### Sports Betting Endpoints
- `GET /sports/odds` - Get live odds
- `GET /sports/markets` - Available markets
- `POST /sports/bet` - Place sports bet
- `GET /sports/bets` - Betting history

### Admin Endpoints
- `GET /admin/dashboard` - Dashboard stats
- `GET /admin/users` - User management
- `POST /admin/users/:userId/suspend` - Suspend user
- `POST /admin/games/odds` - Update game odds

### Analytics Endpoints
- `GET /analytics/user/:userId` - User analytics

📖 **For complete API documentation with examples, see** [docs/API.md](docs/API.md)

---

## To-Do List App

### 📋 What's Included

A **full-featured To-Do List Application** with:

✨ **Core Features**
- Add, edit, delete tasks
- Mark tasks as complete/incomplete
- Auto-save to Local Storage
- Search and filter (All, Active, Completed)
- Sort by Date, Priority, or Name

🎯 **Advanced Features**
- Priority levels (Low, Medium, High)
- Real-time statistics (Total, Completed, Pending, %)
- Import tasks from JSON
- Export tasks to JSON file
- Beautiful responsive design
- Toast notifications for actions

### 🚀 Getting Started

```bash
# Simply open in your browser
open todo-app/index.html
```

### 📂 Files
- `todo-app/index.html` - HTML structure with UI elements
- `todo-app/styles.css` - Beautiful styling & animations
- `todo-app/app.js` - Complete JavaScript logic (TodoApp class)
- `todo-app/README.md` - Full To-Do app documentation

### 💾 Local Storage Usage
- Tasks are automatically saved to browser's local storage
- Format: `localStorage.setItem('todos', JSON.stringify(tasks))`
- No server required - works offline!

📖 **For complete To-Do app documentation, see** [todo-app/README.md](todo-app/README.md)

---

## Documentation

Complete documentation is available in the `docs/` folder:

| Document | Description |
|----------|-------------|
| 📖 [API.md](docs/API.md) | 21+ endpoints with request/response examples |
| 🔧 [CURL_EXAMPLES.md](docs/CURL_EXAMPLES.md) | Ready-to-use cURL commands for all endpoints |
| 💻 [JAVASCRIPT_EXAMPLES.md](docs/JAVASCRIPT_EXAMPLES.md) | Frontend integration with React components |
| 📊 [GAME_FLOW_DIAGRAMS.md](docs/GAME_FLOW_DIAGRAMS.md) | Visual flowcharts and step-by-step walkthroughs |
| 🧪 [TESTING_GUIDE.md](docs/TESTING_GUIDE.md) | Testing procedures and fairness verification |
| ⚠️ [ERROR_HANDLING.md](docs/ERROR_HANDLING.md) | Common errors with solutions |

---

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

---

## Game Fair Play Rules

### House Edge Configuration
| Game | House Edge |
|------|-----------|
| Dice | 5% |
| Roulette | 2.7% |
| Slots | 8% |
| Crash | 3% |
| Color Prediction | 5% |

### Provably Fair System
- ✅ Seed-based RNG for verifiable results
- ✅ Client seed combination
- ✅ Server seed hash verification
- ✅ Transparent calculation
- ✅ User verification possible

📖 **For detailed fairness testing, see** [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md)

---

## Deployment

### Heroku
```bash
git push heroku main
```

### AWS/DigitalOcean
```bash
# Build Docker image
docker build -t benjamin .

# Run container
docker run -p 5000:5000 benjamin
```

### Docker Compose
```bash
docker-compose up -d
```

---

## Legal Notice

⚠️ **Important**: This platform requires:
- Gaming license (varies by jurisdiction)
- Compliance with local gambling laws
- AML/KYC procedures
- Responsible gambling features
- Data protection compliance (GDPR, etc.)

**Consult legal professionals before deployment.**

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## License

MIT License - see LICENSE.md

---

## Support

For issues and questions:
- 📋 GitHub Issues: https://github.com/benjaminshaw11/Benjamin/issues
- 📧 Email: support@bettingplatform.com
- 📚 Documentation: See `docs/` folder

---

## Quick Links

- 🎰 **Betting Platform** - Full-stack gaming platform
- 📋 **To-Do App** - Productivity tool with local storage
- 📖 **API Docs** - Complete endpoint documentation
- 🧪 **Testing Guide** - Fairness verification procedures
- 💻 **Code Examples** - JavaScript, cURL, and more

---

**Built with ❤️ for next-gen betting platforms and productivity tools**

**Last Updated**: 2026-07-15
