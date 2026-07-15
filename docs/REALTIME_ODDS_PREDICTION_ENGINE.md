# 🔄 Real-Time Odds & Prediction Engine Architecture

## Overview

This document outlines the complete architecture for implementing automated real-time updates for sports betting odds and prediction markets on the Benjamin platform.

---

## 1. Real-Time Odds Update Engine

### 1.1 Dynamic Odds Calculation Algorithm

```javascript
// backend/src/services/oddsEngine.js

class OddsEngine {
  /**
   * Calculate odds based on:
   * - Betting volume ratio
   * - Market sentiment
   * - Sharp bettor activity
   * - Historical data
   */
  
  calculateOdds(market) {
    const {
      totalBetsHome,
      totalBetsAway,
      initialOdds,
      sharpBetActivity,
      volatility
    } = market;
    
    // Calculate odds shift based on money flow
    const homePercentage = totalBetsHome / (totalBetsHome + totalBetsAway);
    const awayPercentage = totalBetsAway / (totalBetsHome + totalBetsAway);
    
    // Apply sharp bettor weighting (80% of max bet = sharp)
    const sharpWeight = sharpBetActivity * 1.5;
    
    // Recalculate implied probability
    const impliedProb = this.calculateImpliedProbability(
      homePercentage,
      awayPercentage,
      sharpWeight
    );
    
    // Convert back to decimal odds
    const newOdds = {
      home: 1 / (impliedProb.home * 0.98), // 2% vigorish
      away: 1 / (impliedProb.away * 0.98),
      draw: impliedProb.draw ? 1 / (impliedProb.draw * 0.98) : null
    };
    
    return newOdds;
  }

  calculateImpliedProbability(home, away, weight) {
    const totalWeight = home + away + weight;
    return {
      home: (home + weight * 0.3) / totalWeight,
      away: (away + weight * 0.3) / totalWeight,
      draw: (weight * 0.4) / totalWeight
    };
  }

  // Update odds with movement limits
  updateOddsWithLimits(oldOdds, newOdds, maxMovement = 0.05) {
    const adjustedOdds = {};
    
    for (const [key, value] of Object.entries(newOdds)) {
      const movement = Math.abs(value - oldOdds[key]) / oldOdds[key];
      
      if (movement > maxMovement) {
        // Gradual movement to prevent sharp moves
        adjustedOdds[key] = oldOdds[key] * (1 + (maxMovement * 0.5));
      } else {
        adjustedOdds[key] = value;
      }
    }
    
    return adjustedOdds;
  }
}

module.exports = new OddsEngine();
```

### 1.2 WebSocket Broadcasting System

```javascript
// backend/src/services/oddsUpdater.js

const { io } = require('../server');
const oddsEngine = require('./oddsEngine');

class OddsUpdater {
  // Update odds every 5-30 seconds based on event type
  startOddsUpdates(marketId, updateInterval = 5000) {
    const interval = setInterval(async () => {
      try {
        const market = await this.getMarket(marketId);
        const newOdds = oddsEngine.calculateOdds(market);
        
        // Broadcast to all users watching this market
        io.to(`market-${marketId}`).emit('odds-updated', {
          marketId,
          oldOdds: market.currentOdds,
          newOdds,
          timestamp: new Date(),
          movement: this.calculateOddsMovement(market.currentOdds, newOdds)
        });
        
        // Update database
        await market.update({ currentOdds: newOdds, lastUpdated: new Date() });
        
      } catch (error) {
        console.error(`Odds update error for market ${marketId}:`, error);
      }
    }, updateInterval);
    
    return interval;
  }

  calculateOddsMovement(oldOdds, newOdds) {
    return {
      home: ((newOdds.home - oldOdds.home) / oldOdds.home * 100).toFixed(2),
      away: ((newOdds.away - oldOdds.away) / oldOdds.away * 100).toFixed(2),
      direction: {
        home: newOdds.home > oldOdds.home ? 'down' : 'up',
        away: newOdds.away > oldOdds.away ? 'down' : 'up'
      }
    };
  }

  // Stop updates when market closes
  stopOddsUpdates(intervalId) {
    clearInterval(intervalId);
  }
}

module.exports = new OddsUpdater();
```

---

## 2. Live Data Integration

### 2.1 External Data Sources

```javascript
// backend/src/services/liveDataConnector.js

const axios = require('axios');
const redis = require('redis');

class LiveDataConnector {
  constructor() {
    this.redisClient = redis.createClient();
    this.apiConnections = {
      // Sports Data
      espn: 'https://api.espn.com',
      sportRadar: 'https://api.sportradar.com',
      
      // Financial Data
      alpha_vantage: 'https://www.alphavantage.co',
      finnhub: 'https://finnhub.io/api/v1',
      
      // Crypto Data
      coingecko: 'https://api.coingecko.com/api/v3',
      
      // News Data
      newsapi: 'https://newsapi.org/v2',
      eventRegistry: 'https://eventregistry.org/api/v1'
    };
  }

  // Fetch live sports scores
  async getLiveScores(sport, league) {
    const cacheKey = `scores:${sport}:${league}`;
    const cached = await this.redisClient.get(cacheKey);
    
    if (cached) return JSON.parse(cached);
    
    try {
      const response = await axios.get(
        `${this.apiConnections.espn}/site/api/site/v2/sports/${sport}/${league}/scoreboard`
      );
      
      const scores = response.data.events.map(event => ({
        eventId: event.id,
        homeTeam: event.competitions[0].competitors[0].team.displayName,
        awayTeam: event.competitions[0].competitors[1].team.displayName,
        homeScore: event.competitions[0].competitors[0].score,
        awayScore: event.competitions[0].competitors[1].score,
        status: event.status.type.description,
        lastUpdated: new Date()
      }));
      
      // Cache for 30 seconds
      await this.redisClient.setex(cacheKey, 30, JSON.stringify(scores));
      return scores;
    } catch (error) {
      console.error('Live scores fetch error:', error);
      throw error;
    }
  }

  // Fetch player injury reports
  async getInjuryReports(sport, league) {
    const cacheKey = `injuries:${sport}:${league}`;
    const cached = await this.redisClient.get(cacheKey);
    
    if (cached) return JSON.parse(cached);
    
    try {
      const response = await axios.get(
        `${this.apiConnections.sportRadar}/injuries`,
        { headers: { 'X-RapidAPI-Key': process.env.SPORTRADAR_API_KEY } }
      );
      
      const injuries = response.data.map(report => ({
        playerId: report.player_id,
        playerName: report.player_name,
        team: report.team,
        status: report.status, // out, day_to_day, questionable
        returnDate: report.expected_return,
        impact: this.calculatePlayerImpact(report)
      }));
      
      // Cache for 1 hour
      await this.redisClient.setex(cacheKey, 3600, JSON.stringify(injuries));
      return injuries;
    } catch (error) {
      console.error('Injury reports fetch error:', error);
      throw error;
    }
  }

  // Fetch stock/commodity prices
  async getMarketData(symbol, assetType = 'stock') {
    const cacheKey = `market:${assetType}:${symbol}`;
    const cached = await this.redisClient.get(cacheKey);
    
    if (cached) return JSON.parse(cached);
    
    try {
      const endpoint = assetType === 'crypto' 
        ? `${this.apiConnections.coingecko}/simple/price`
        : `${this.apiConnections.finnhub}/quote`;
      
      const response = await axios.get(endpoint, {
        params: {
          ids: symbol.toLowerCase(),
          vs_currencies: 'usd',
          token: process.env.FINNHUB_API_KEY
        }
      });
      
      const price = response.data[symbol.toLowerCase()].usd || response.data.c;
      
      // Cache for 5 seconds (market data changes frequently)
      await this.redisClient.setex(cacheKey, 5, JSON.stringify(price));
      return price;
    } catch (error) {
      console.error('Market data fetch error:', error);
      throw error;
    }
  }

  // Fetch breaking news for predictions
  async getNews(keywords, language = 'en') {
    const cacheKey = `news:${keywords.join('-')}`;
    const cached = await this.redisClient.get(cacheKey);
    
    if (cached) return JSON.parse(cached);
    
    try {
      const response = await axios.get(`${this.apiConnections.newsapi}/everything`, {
        params: {
          q: keywords.join(' OR '),
          language,
          sortBy: 'publishedAt',
          apiKey: process.env.NEWSAPI_KEY,
          pageSize: 20
        }
      });
      
      const articles = response.data.articles.map(article => ({
        title: article.title,
        description: article.description,
        source: article.source.name,
        url: article.url,
        publishedAt: article.publishedAt,
        sentiment: this.analyzeSentiment(article.description),
        impact: 'medium' // calculated from source credibility
      }));
      
      // Cache for 10 minutes
      await this.redisClient.setex(cacheKey, 600, JSON.stringify(articles));
      return articles;
    } catch (error) {
      console.error('News fetch error:', error);
      throw error;
    }
  }

  calculatePlayerImpact(report) {
    // Calculate impact score 0-100
    const baseImpact = {
      'out': 80,
      'day_to_day': 40,
      'questionable': 20
    };
    
    // Adjust based on player rating/importance
    const playerImportance = report.importance || 0.5;
    return Math.round(baseImpact[report.status] * playerImportance);
  }

  analyzeSentiment(text) {
    // Simplified sentiment analysis (use NLP library in production)
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'gains'];
    const negativeWords = ['bad', 'poor', 'negative', 'losses', 'crash'];
    
    const posCount = positiveWords.filter(w => text.toLowerCase().includes(w)).length;
    const negCount = negativeWords.filter(w => text.toLowerCase().includes(w)).length;
    
    if (posCount > negCount) return 'positive';
    if (negCount > posCount) return 'negative';
    return 'neutral';
  }
}

module.exports = new LiveDataConnector();
```

---

## 3. Automated Market Maker (AMM) for Predictions

### 3.1 Prediction Market Probability Engine

```javascript
// backend/src/services/predictionAMM.js

class PredictionAMM {
  /**
   * Constant Product Market Maker (CPMM)
   * x * y = k
   * Where x = yes liquidity, y = no liquidity, k = constant
   */

  calculateProbability(yesLiquidity, noLiquidity) {
    const totalLiquidity = yesLiquidity + noLiquidity;
    return {
      yes: yesLiquidity / totalLiquidity,
      no: noLiquidity / totalLiquidity
    };
  }

  updateProbabilityFromBets(market, newBetData) {
    const { betType, betAmount } = newBetData;
    
    let yesLiquidity = market.yesLiquidity;
    let noLiquidity = market.noLiquidity;
    
    if (betType === 'yes') {
      yesLiquidity -= betAmount; // Remove from yes pool
      noLiquidity += (betAmount * market.currentOdds.yes); // Add to no pool
    } else {
      noLiquidity -= betAmount; // Remove from no pool
      yesLiquidity += (betAmount * market.currentOdds.no); // Add to yes pool
    }
    
    const newProbability = this.calculateProbability(yesLiquidity, noLiquidity);
    const newOdds = {
      yes: 1 / newProbability.yes,
      no: 1 / newProbability.no
    };
    
    return { newProbability, newOdds, yesLiquidity, noLiquidity };
  }

  // Update probabilities based on external news
  updateProbabilityFromNews(market, newsData) {
    const sentimentShift = {
      'positive': 0.05,
      'negative': -0.05,
      'neutral': 0
    };
    
    const shift = sentimentShift[newsData.sentiment] || 0;
    const currentYesProb = market.currentProbability.yes;
    const newYesProb = Math.min(0.95, Math.max(0.05, currentYesProb + shift));
    
    return {
      yes: newYesProb,
      no: 1 - newYesProb,
      source: 'news_sentiment'
    };
  }

  // Update from expert predictions
  updateProbabilityFromExperts(market, expertPredictions) {
    const averageExpertProb = expertPredictions.reduce((sum, pred) => 
      sum + pred.probability, 0
    ) / expertPredictions.length;
    
    // Weight expert predictions at 20% influence
    const currentProb = market.currentProbability.yes;
    const blendedProb = (currentProb * 0.8) + (averageExpertProb * 0.2);
    
    return {
      yes: blendedProb,
      no: 1 - blendedProb,
      source: 'expert_consensus'
    };
  }

  // Hybrid probability from multiple sources
  calculateHybridProbability(market, sources) {
    const weights = {
      betting_volume: 0.4,
      news_sentiment: 0.25,
      expert_predictions: 0.25,
      historical_data: 0.1
    };
    
    let weightedProb = 0;
    let totalWeight = 0;
    
    for (const [source, value] of Object.entries(sources)) {
      if (weights[source]) {
        weightedProb += value * weights[source];
        totalWeight += weights[source];
      }
    }
    
    return weightedProb / totalWeight;
  }
}

module.exports = new PredictionAMM();
```

---

## 4. Scheduled Jobs & Background Workers

### 4.1 Cron Jobs Setup

```javascript
// backend/src/jobs/scheduler.js

const cron = require('node-cron');
const oddsUpdater = require('../services/oddsUpdater');
const liveDataConnector = require('../services/liveDataConnector');
const predictionAMM = require('../services/predictionAMM');
const MarketModel = require('../models/Market');
const PredictionModel = require('../models/Prediction');

class JobScheduler {
  static initializeJobs() {
    // Update sports betting odds every 10 seconds during events
    cron.schedule('*/10 * * * * *', async () => {
      try {
        const liveMarkets = await MarketModel.findAll({
          where: { status: 'live' }
        });
        
        for (const market of liveMarkets) {
          await oddsUpdater.startOddsUpdates(market.id, 10000);
        }
      } catch (error) {
        console.error('Sports odds update job error:', error);
      }
    });

    // Update prediction probabilities every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      try {
        const activePredictions = await PredictionModel.findAll({
          where: { status: 'active' }
        });
        
        for (const prediction of activePredictions) {
          const newsData = await liveDataConnector.getNews(
            prediction.keywords
          );
          
          if (newsData.length > 0) {
            const updatedProb = predictionAMM.updateProbabilityFromNews(
              prediction,
              newsData[0]
            );
            
            await prediction.update({
              currentProbability: updatedProb,
              lastUpdated: new Date()
            });
            
            // Broadcast update
            io.to(`prediction-${prediction.id}`).emit('probability-updated', {
              predictionId: prediction.id,
              probability: updatedProb,
              source: 'news',
              timestamp: new Date()
            });
          }
        }
      } catch (error) {
        console.error('Prediction update job error:', error);
      }
    });

    // Fetch live scores every 15 seconds
    cron.schedule('*/15 * * * * *', async () => {
      try {
        const sports = ['football', 'basketball', 'baseball', 'hockey'];
        
        for (const sport of sports) {
          const scores = await liveDataConnector.getLiveScores(sport, 'nfl');
          
          for (const score of scores) {
            // Update related markets with new scores
            const relatedMarkets = await MarketModel.findAll({
              where: {
                sport,
                eventId: score.eventId,
                status: 'live'
              }
            });
            
            for (const market of relatedMarkets) {
              await market.update({
                liveScore: {
                  home: score.homeScore,
                  away: score.awayScore
                },
                lastScoreUpdate: new Date()
              });
              
              io.to(`market-${market.id}`).emit('score-updated', {
                marketId: market.id,
                score: score,
                timestamp: new Date()
              });
            }
          }
        }
      } catch (error) {
        console.error('Live scores job error:', error);
      }
    });

    // Check for market resolution every minute
    cron.schedule('0 * * * * *', async () => {
      try {
        const closingMarkets = await MarketModel.findAll({
          where: {
            status: 'pending_resolution',
            eventDate: { $lte: new Date() }
          }
        });
        
        for (const market of closingMarkets) {
          await this.resolveMarket(market);
        }
      } catch (error) {
        console.error('Market resolution job error:', error);
      }
    });

    // Fetch injury updates every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      try {
        const injuries = await liveDataConnector.getInjuryReports('nfl', 'nfl');
        
        // Update player availability status
        for (const injury of injuries) {
          // Update related markets
          const markets = await MarketModel.findAll({
            where: { affectedPlayers: { $contains: injury.playerId } }
          });
          
          for (const market of markets) {
            const impact = injury.impact * 0.01; // Convert to percentage
            
            const updatedOdds = {
              ...market.currentOdds,
              // Adjust odds based on injury impact
              home: market.currentOdds.home * (1 + impact),
              away: market.currentOdds.away * (1 - impact)
            };
            
            await market.update({
              currentOdds: updatedOdds,
              lastUpdated: new Date()
            });
            
            io.to(`market-${market.id}`).emit('odds-adjusted', {
              marketId: market.id,
              reason: `Injury: ${injury.playerName}`,
              oldOdds: market.currentOdds,
              newOdds: updatedOdds
            });
          }
        }
      } catch (error) {
        console.error('Injury update job error:', error);
      }
    });

    // Clean up expired betting markets every hour
    cron.schedule('0 * * * *', async () => {
      try {
        const expiredMarkets = await MarketModel.findAll({
          where: {
            closingDate: { $lt: new Date() },
            status: { $ne: 'resolved' }
          }
        });
        
        for (const market of expiredMarkets) {
          await market.update({ status: 'closed' });
        }
      } catch (error) {
        console.error('Market cleanup job error:', error);
      }
    });

    console.log('✅ All scheduled jobs initialized');
  }

  static async resolveMarket(market) {
    try {
      // Get final result
      const finalResult = await this.getFinalResult(market);
      
      // Calculate payouts
      const payouts = this.calculatePayouts(market, finalResult);
      
      // Update all winning bets
      for (const [bettorId, amount] of Object.entries(payouts)) {
        await this.creditWinnings(bettorId, amount);
      }
      
      // Update market status
      await market.update({
        status: 'resolved',
        result: finalResult,
        resolvedAt: new Date()
      });
      
      // Notify all users
      io.to(`market-${market.id}`).emit('market-resolved', {
        marketId: market.id,
        result: finalResult,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error(`Market resolution error for ${market.id}:`, error);
    }
  }

  static async getFinalResult(market) {
    // Fetch final scores/data based on market type
    if (market.sport) {
      const scores = await liveDataConnector.getLiveScores(
        market.sport,
        market.league
      );
      return scores.find(s => s.eventId === market.eventId);
    }
    // For prediction markets, use resolution data
    return null;
  }

  static calculatePayouts(market, result) {
    // Calculate how much each bettor won
    const payouts = {};
    
    for (const bet of market.bets) {
      if (this.isBetWinner(bet, result)) {
        const winnings = bet.amount * bet.odds;
        payouts[bet.userId] = (payouts[bet.userId] || 0) + winnings;
      }
    }
    
    return payouts;
  }

  static isBetWinner(bet, result) {
    // Check if bet matches result
    if (bet.betType === 'match_winner') {
      return bet.prediction === result.winner;
    }
    // ... other bet types
    return false;
  }

  static async creditWinnings(userId, amount) {
    // Update user wallet/balance
    const user = await UserModel.findByPk(userId);
    await user.increment('balance', { by: amount });
  }
}

module.exports = JobScheduler;
```

### 4.2 Initialize Scheduler in Server

```javascript
// backend/src/server.js (updated)

const JobScheduler = require('./jobs/scheduler');

// ... existing code ...

sequelize.sync({ alter: true }).then(() => {
  // Initialize scheduled jobs
  JobScheduler.initializeJobs();
  
  server.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`🗄️  Database connected`);
    console.log(`🔌 WebSocket ready`);
    console.log(`⏰ Scheduled jobs active`);
  });
}).catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});
```

---

## 5. Database Schema Updates

### 5.1 Market Table Schema

```sql
-- Sports Betting Markets
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sport VARCHAR(50) NOT NULL,
  league VARCHAR(100),
  eventId VARCHAR(100) UNIQUE,
  eventDate TIMESTAMP NOT NULL,
  closingDate TIMESTAMP NOT NULL,
  
  -- Teams/Competitors
  homeTeam VARCHAR(100),
  awayTeam VARCHAR(100),
  
  -- Odds & Probabilities
  initialOdds JSONB,
  currentOdds JSONB NOT NULL,
  lastOddsUpdate TIMESTAMP,
  
  -- Live Data
  liveScore JSONB,
  lastScoreUpdate TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, live, closing, closed, resolved, cancelled
  result JSONB,
  resolvedAt TIMESTAMP,
  
  -- Metadata
  volume DECIMAL(15,2) DEFAULT 0,
  affectedPlayers TEXT[] DEFAULT ARRAY[]::TEXT[],
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX (sport, league),
  INDEX (eventDate),
  INDEX (status)
);

-- Prediction Markets
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  description TEXT,
  
  -- Resolution
  resolutionCriteria TEXT,
  startDate TIMESTAMP,
  resolutionDate TIMESTAMP NOT NULL,
  closingDate TIMESTAMP NOT NULL,
  
  -- Probabilities
  initialProbability JSONB,
  currentProbability JSONB,
  lastProbabilityUpdate TIMESTAMP,
  updateSource VARCHAR(100), -- betting_volume, news, experts, hybrid
  
  -- Outcomes
  outcomes JSONB NOT NULL, -- {yes, no, maybe, etc}
  result VARCHAR(100),
  resolvedAt TIMESTAMP,
  
  -- Market Data
  volume DECIMAL(15,2) DEFAULT 0,
  liquidityPool DECIMAL(15,2),
  participants INT DEFAULT 0,
  
  -- Keywords for news monitoring
  keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, active, closing, closed, resolved
  
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX (category),
  INDEX (resolutionDate),
  INDEX (status),
  INDEX (keywords)
);

-- Bets Table
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES users(id),
  marketId UUID REFERENCES markets(id),
  predictionId UUID REFERENCES predictions(id),
  
  betType VARCHAR(100), -- match_winner, over_under, etc
  betAmount DECIMAL(15,2) NOT NULL,
  odds DECIMAL(10,4) NOT NULL,
  prediction VARCHAR(100), -- home, away, yes, no, etc
  
  -- Payout
  potentialWinnings DECIMAL(15,2),
  actualWinnings DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'pending', -- pending, won, lost, voided
  
  placedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  settledAt TIMESTAMP,
  
  INDEX (userId),
  INDEX (marketId),
  INDEX (predictionId),
  INDEX (status)
);
```

---

## 6. Real-Time WebSocket Events

### 6.1 Event Types

```javascript
// Events broadcast from server to connected clients

// Sports Betting Events
{
  event: 'odds-updated',
  data: {
    marketId: 'uuid',
    oldOdds: { home: 2.1, away: 3.5 },
    newOdds: { home: 2.15, away: 3.45 },
    movement: { home: '2.4%', away: '-1.4%' },
    timestamp: '2026-07-15T10:30:00Z'
  }
}

{
  event: 'score-updated',
  data: {
    marketId: 'uuid',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    homeScore: 2,
    awayScore: 1,
    period: '2nd Half',
    timestamp: '2026-07-15T10:30:00Z'
  }
}

{
  event: 'odds-adjusted',
  data: {
    marketId: 'uuid',
    reason: 'Injury: Kevin De Bruyne (Out)',
    oldOdds: { home: 2.1 },
    newOdds: { home: 2.25 },
    impact: 'Player crucial to team strategy'
  }
}

{
  event: 'market-closed',
  data: {
    marketId: 'uuid',
    closingReason: 'Event started',
    finalOdds: { home: 2.1, away: 3.5 },
    timestamp: '2026-07-15T10:30:00Z'
  }
}

{
  event: 'market-resolved',
  data: {
    marketId: 'uuid',
    result: { winner: 'home', finalScore: '2-1' },
    payoutInfo: { totalWinningBets: 50, totalPayout: 250000 },
    timestamp: '2026-07-15T11:45:00Z'
  }
}

// Prediction Market Events
{
  event: 'probability-updated',
  data: {
    predictionId: 'uuid',
    title: 'Will XYZ Tech reach $1T market cap?',
    oldProbability: { yes: 0.65, no: 0.35 },
    newProbability: { yes: 0.68, no: 0.32 },
    source: 'news_sentiment',
    trigger: 'Positive earnings report',
    timestamp: '2026-07-15T10:30:00Z'
  }
}

{
  event: 'expert-prediction-added',
  data: {
    predictionId: 'uuid',
    expert: 'Dr. Jane Smith',
    expertise: 'Technology & Markets',
    prediction: 'yes',
    confidence: 0.72,
    reasoning: 'Company trajectory strongly positive',
    timestamp: '2026-07-15T10:30:00Z'
  }
}

{
  event: 'market-resolved',
  data: {
    predictionId: 'uuid',
    result: 'yes',
    payouts: { winners: 1200, totalAmount: 500000 },
    resolvedAt: '2026-07-15T11:45:00Z'
  }
}
```

---

## 7. Performance Optimization

### 7.1 Caching Strategy

```javascript
// backend/src/utils/cacheManager.js

const redis = require('redis');

class CacheManager {
  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
  }

  // Cache configuration
  cacheTTL = {
    liveOdds: 5,           // 5 seconds
    scores: 30,            // 30 seconds
    injuries: 3600,        // 1 hour
    news: 600,             // 10 minutes
    marketData: 5,         // 5 seconds
    predictions: 30        // 30 seconds
  };

  async setCache(key, value, ttl = 300) {
    await this.client.setex(
      key,
      ttl,
      JSON.stringify(value)
    );
  }

  async getCache(key) {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async invalidateCache(pattern) {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }
}

module.exports = new CacheManager();
```

---

## 8. Monitoring & Alerts

### 8.1 Health Checks

```javascript
// backend/src/jobs/monitoring.js

const Monitor = {
  async checkOddsUpdateHealth() {
    const lastUpdate = await redis.get('last-odds-update');
    const lastUpdateTime = new Date(lastUpdate);
    const timeSinceUpdate = Date.now() - lastUpdateTime;
    
    if (timeSinceUpdate > 60000) { // > 1 minute
      console.warn('⚠️ Odds update delay detected:', timeSinceUpdate, 'ms');
      await sendAlert('Odds Update Health Check Failed');
    }
  },

  async checkDataConnectorHealth() {
    const apiHealthChecks = {
      espn: '/health',
      sportradar: '/health',
      finnhub: '/status'
    };
    
    for (const [api, endpoint] of Object.entries(apiHealthChecks)) {
      try {
        await axios.get(`${this.apiConnections[api]}${endpoint}`);
      } catch (error) {
        console.error(`⚠️ ${api} data connector unhealthy`);
        await sendAlert(`${api} API is down`);
      }
    }
  },

  async checkDatabaseHealth() {
    const health = await sequelize.authenticate();
    if (!health) {
      console.error('❌ Database connection lost');
      await sendAlert('Database connection failed');
    }
  }
};

cron.schedule('*/5 * * * *', () => {
  Monitor.checkOddsUpdateHealth();
  Monitor.checkDataConnectorHealth();
  Monitor.checkDatabaseHealth();
});
```

---

## Summary

This architecture enables:

✅ **Real-time odds updates** - Every 5-30 seconds based on event type
✅ **Live data integration** - Scores, injuries, news, market data
✅ **Automated prediction probabilities** - Updated from multiple data sources
✅ **Market resolution** - Automatic settlement when events conclude
✅ **WebSocket broadcasting** - Instant client notifications
✅ **Performance optimization** - Redis caching & connection pooling
✅ **Health monitoring** - Alerts for failures

---

**Next Steps:**
1. Install dependencies: `npm install redis node-cron axios`
2. Update `.env` with API keys
3. Deploy scheduled jobs
4. Test real-time updates with WebSocket client
5. Monitor and optimize based on load

---

**Last Updated**: 2026-07-15
**Platform**: Benjamin Casino & Sports Betting
