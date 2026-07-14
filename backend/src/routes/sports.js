const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { User, Wallet, Bet } = require('../models');
const OddsCalculator = require('../utils/odds');
const axios = require('axios');

const router = express.Router();

const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY;

// Get live odds
router.get('/odds', async (req, res) => {
  try {
    if (!API_FOOTBALL_KEY) {
      return res.json({
        message: 'API key not configured',
        sample: [
          {
            fixtureId: 1,
            homeTeam: 'Manchester United',
            awayTeam: 'Liverpool',
            homeOdds: 1.85,
            drawOdds: 3.50,
            awayOdds: 4.20,
            timestamp: new Date()
          },
          {
            fixtureId: 2,
            homeTeam: 'Arsenal',
            awayTeam: 'Chelsea',
            homeOdds: 2.10,
            drawOdds: 3.40,
            awayOdds: 3.50,
            timestamp: new Date()
          }
        ]
      });
    }

    // Fetch from API Football
    const response = await axios.get('https://api-football-v1.p.rapidapi.com/v3/fixtures', {
      params: { live: 'all' },
      headers: {
        'x-rapidapi-key': API_FOOTBALL_KEY,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com'
      }
    });

    const odds = response.data.response.map(fixture => ({
      fixtureId: fixture.fixture.id,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      homeOdds: OddsCalculator.calculateOdds(0.45),
      drawOdds: OddsCalculator.calculateOdds(0.30),
      awayOdds: OddsCalculator.calculateOdds(0.25),
      status: fixture.fixture.status.short,
      timestamp: new Date(fixture.fixture.timestamp * 1000)
    }));

    res.json(odds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Place sports bet
router.post('/bet', authMiddleware, async (req, res) => {
  try {
    const { fixtureId, amount, betType, selection } = req.body;
    const userId = req.user.id;

    // Validate bet
    if (amount < 10 || amount > 100000) {
      return res.status(400).json({ error: 'Bet amount out of range' });
    }

    const user = await User.findByPk(userId);
    const wallet = await user.getWallet();

    if (wallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Determine odds
    let odds;
    if (betType === 'moneyline') {
      odds = selection === 'home' ? 1.85 : selection === 'draw' ? 3.50 : 4.20;
    } else if (betType === 'spread') {
      odds = 1.95;
    } else if (betType === 'total') {
      odds = 1.95;
    }

    // Deduct bet from wallet
    wallet.balance -= amount;
    await wallet.save();

    // Create bet
    const bet = await Bet.create({
      userId,
      gameType: 'sports',
      amount,
      odds,
      potential_payout: OddsCalculator.calculatePayout(amount, odds),
      status: 'pending',
      betData: {
        fixtureId,
        betType,
        selection,
        placed_at: new Date()
      }
    });

    res.json({
      betId: bet.id,
      fixtureId,
      amount,
      odds,
      potential_payout: OddsCalculator.calculatePayout(amount, odds),
      status: 'pending'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sports betting markets
router.get('/markets', (req, res) => {
  const markets = [
    { id: 'moneyline', name: 'Moneyline', description: 'Pick the winner' },
    { id: 'spread', name: 'Spread', description: 'Pick winner with point margin' },
    { id: 'total', name: 'Total', description: 'Predict total points/goals' },
    { id: 'prop', name: 'Prop Bets', description: 'Player/team specific outcomes' }
  ];
  res.json(markets);
});

module.exports = router;
