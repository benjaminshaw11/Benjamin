# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer {token}
```

## Auth Endpoints

### Register
```
POST /auth/register

Body:
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}

Response:
{
  "message": "Registration successful",
  "token": "jwt_token",
  "user": {...}
}
```

### Login
```
POST /auth/login

Body:
{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {...}
}
```

### Get Current User
```
GET /auth/me

Response:
{
  "user": {...},
  "wallet": {...}
}
```

## Games Endpoints

### Get Available Games
```
GET /games

Response:
[
  {
    "id": "dice",
    "name": "Dice",
    "minBet": 10,
    "maxBet": 100000,
    "houseEdge": 0.05
  },
  ...
]
```

### Place Bet
```
POST /games/bet

Body:
{
  "gameType": "dice",
  "amount": 100,
  "clientSeed": "random_string",
  "betData": {
    "targetMultiplier": 2
  }
}

Response:
{
  "betId": "uuid",
  "gameResult": {...},
  "payout": 200,
  "won": true,
  "newBalance": 9900,
  "verificationData": {...}
}
```

### Get Bet History
```
GET /games/history

Response:
[
  {
    "id": "uuid",
    "gameType": "dice",
    "amount": 100,
    "odds": 2,
    "status": "won",
    "payout": 200,
    "createdAt": "2024-01-01T12:00:00Z"
  },
  ...
]
```

### Verify Bet Fairness
```
POST /games/verify

Body:
{
  "betId": "uuid",
  "serverSeed": "server_seed_value"
}

Response:
{
  "verified": true,
  "betId": "uuid",
  "gameType": "dice",
  "result": {...}
}
```

## Wallet Endpoints

### Get Balance
```
GET /wallet/balance

Response:
{
  "balance": 5000.00,
  "currency": "INR",
  "locked": 100.00
}
```

### Initiate Deposit
```
POST /wallet/deposit

Body:
{
  "amount": 1000
}

Response:
{
  "orderId": "razorpay_order_id",
  "amount": 100000,
  "currency": "INR"
}
```

### Verify Deposit
```
POST /wallet/deposit/verify

Body:
{
  "orderId": "order_id",
  "paymentId": "payment_id",
  "signature": "signature_hash"
}

Response:
{
  "message": "Deposit verified successfully",
  "newBalance": 6000.00
}
```

### Withdraw
```
POST /wallet/withdraw

Body:
{
  "amount": 500,
  "accountDetails": {
    "accountHolder": "Name",
    "accountNumber": "1234567890",
    "ifscCode": "SBIN0001234"
  }
}

Response:
{
  "message": "Withdrawal request submitted",
  "transactionId": "uuid",
  "status": "pending"
}
```

### Get Transactions
```
GET /wallet/transactions

Response:
[
  {
    "id": "uuid",
    "type": "deposit",
    "amount": 1000,
    "status": "completed",
    "createdAt": "2024-01-01T12:00:00Z"
  },
  ...
]
```

## Sports Betting Endpoints

### Get Live Odds
```
GET /sports/odds

Response:
[
  {
    "fixtureId": 1,
    "homeTeam": "Manchester United",
    "awayTeam": "Liverpool",
    "homeOdds": 1.85,
    "drawOdds": 3.50,
    "awayOdds": 4.20,
    "timestamp": "2024-01-01T15:00:00Z"
  },
  ...
]
```

### Place Sports Bet
```
POST /sports/bet

Body:
{
  "fixtureId": 1,
  "amount": 500,
  "betType": "moneyline",
  "selection": "home"
}

Response:
{
  "betId": "uuid",
  "fixtureId": 1,
  "amount": 500,
  "odds": 1.85,
  "potential_payout": 925,
  "status": "pending"
}
```

## Prediction Market Endpoints

### Get Markets
```
GET /prediction/markets

Response:
[
  {
    "id": "uuid",
    "title": "Will Bitcoin reach $100k by Dec 2024?",
    "category": "crypto",
    "yesOdds": 2.1,
    "noOdds": 1.8,
    "totalVolume": 50000,
    "status": "open"
  },
  ...
]
```

### Place Prediction Bet
```
POST /prediction/bet

Body:
{
  "marketId": "uuid",
  "prediction": "yes",
  "amount": 200
}

Response:
{
  "betId": "uuid",
  "market": {
    "id": "uuid",
    "yesOdds": 2.1,
    "noOdds": 1.8
  }
}
```

## Admin Endpoints

### Dashboard Stats
```
GET /admin/dashboard

Response:
{
  "totalUsers": 1500,
  "totalBets": 25000,
  "totalDeposits": 500000,
  "totalWithdrawals": 400000,
  "platformRevenue": 100000,
  "netProfit": 100000
}
```

### Get All Users
```
GET /admin/users

Response:
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "kycVerified": true,
    "totalDeposits": 5000,
    "totalBets": 50000,
    "totalWinnings": 10000
  },
  ...
]
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided" or "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Admin access required"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```
