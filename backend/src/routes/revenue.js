const express = require('express');
const { adminMiddleware, authMiddleware } = require('../middleware/auth');
const { User, Bet, Transaction, VIPUser, Affiliate, Bonus } = require('../models');
const RevenueCalculator = require('../utils/revenueCalculator');

const router = express.Router();

// Get revenue dashboard
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's metrics
    const todayBets = await Bet.findAll({ where: { createdAt: { [Op.gte]: today } } });
    const todayDeposits = await Transaction.findAll({ 
      where: { 
        type: 'deposit',
        status: 'completed',
        createdAt: { [Op.gte]: today }
      }
    });

    const todayWagers = todayBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
    const todayDeposited = todayDeposits.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Calculate revenue by game type
    const gameBreakdown = {};
    const gameEdges = {
      'dice': 0.05, 'crash': 0.03, 'mines': 0.05, 'color': 0.05,
      'roulette': 0.027, 'plinko': 0.05, 'blackjack': 0.005,
      'slots': 0.08, 'sports': 0.045, 'prediction': 0.035
    };

    for (const [gameType, edge] of Object.entries(gameEdges)) {
      const gameBets = todayBets.filter(b => b.gameType === gameType);
      const gameWagers = gameBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
      gameBreakdown[gameType] = {
        wagers: gameWagers,
        revenue: gameWagers * edge,
        edge: `${(edge * 100)}%`,
        betCount: gameBets.length
      };
    }

    const totalRevenue = Object.values(gameBreakdown).reduce((sum, g) => sum + g.revenue, 0);

    res.json({
      date: today,
      todayMetrics: {
        totalWagers: todayWagers,
        totalDeposits: todayDeposited,
        estimatedRevenue: totalRevenue,
        betsPlaced: todayBets.length,
        uniqueBettors: new Set(todayBets.map(b => b.userId)).size
      },
      gameBreakdown,
      projections: {
        dailyRevenue: totalRevenue,
        monthlyRevenue: totalRevenue * 30,
        annualRevenue: totalRevenue * 365
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get revenue by date range
router.get('/range/:startDate/:endDate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const start = new Date(req.params.startDate);
    const end = new Date(req.params.endDate);
    end.setHours(23, 59, 59, 999);

    const bets = await Bet.findAll({
      where: { createdAt: { [Op.between]: [start, end] } }
    });

    const deposits = await Transaction.findAll({
      where: { 
        type: 'deposit',
        status: 'completed',
        createdAt: { [Op.between]: [start, end] }
      }
    });

    const totalWagers = bets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
    const totalDeposits = deposits.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalPayouts = bets.reduce((sum, bet) => sum + parseFloat(bet.payout), 0);
    const totalRevenue = totalWagers - totalPayouts;

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const avgDailyRevenue = totalRevenue / days;

    res.json({
      period: { startDate: start, endDate: end, days },
      metrics: {
        totalWagers,
        totalDeposits,
        totalPayouts,
        totalRevenue,
        avgDailyRevenue,
        totalBets: bets.length,
        houseEdgeAchieved: `${((totalRevenue / totalWagers) * 100).toFixed(2)}%`
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate user profitability
router.post('/user-analysis/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    const userBets = await Bet.findAll({ where: { userId: req.params.userId } });
    const userTransactions = await Transaction.findAll({ where: { userId: req.params.userId } });

    const totalDeposited = userTransactions
      .filter(t => t.type === 'deposit' && t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalWithdrawn = userTransactions
      .filter(t => t.type === 'withdrawal' && t.status === 'completed')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalWagered = userBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
    const totalWinnings = userBets.reduce((sum, bet) => sum + parseFloat(bet.payout), 0);

    const houseProfit = totalWagered - totalWinnings;
    const userLifetimeValue = houseProfit;
    const userRetentionValue = totalDeposited - totalWithdrawn;

    res.json({
      user: { id: user.id, email: user.email, username: user.username },
      deposits: totalDeposited,
      withdrawals: totalWithdrawn,
      netBalance: totalDeposited - totalWithdrawn,
      bettingMetrics: {
        totalWagered,
        totalWinnings,
        totalLosses: totalWagered - totalWinnings,
        betCount: userBets.length,
        avgBetSize: totalWagered / userBets.length,
        winRate: `${((userBets.filter(b => b.status === 'won').length / userBets.length) * 100).toFixed(2)}%`
      },
      profitability: {
        houseProfit,
        userLTV: userLifetimeValue,
        userRetentionValue,
        profitMargin: `${((houseProfit / totalWagered) * 100).toFixed(2)}%`
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get revenue projections
router.post('/projections', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userBase, dailyActiveRate, avgDailyWager, gameDistribution } = req.body;

    const projection = RevenueCalculator.calculateMonthlyPlatformRevenue(
      userBase,
      dailyActiveRate,
      avgDailyWager,
      gameDistribution || {
        'slots': 0.3,
        'sports': 0.3,
        'prediction': 0.2,
        'crash': 0.15,
        'other': 0.05
      }
    );

    res.json(projection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get break-even analysis
router.get('/break-even', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const monthlyFixedCosts = 21000; // From calculations
    const breakEven = RevenueCalculator.calculateBreakEven(monthlyFixedCosts);

    res.json({
      ...breakEven,
      dailyUsersNeeded: Math.ceil(breakEven.breakEvenDailyWagers / 500), // Assuming ₹500 avg wager
      guidance: `Need ${Math.ceil(breakEven.breakEvenDailyWagers / 500)} active users wagering ₹500/day to break even`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
