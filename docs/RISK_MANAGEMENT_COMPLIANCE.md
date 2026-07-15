# 🛡️ Risk Management & Compliance System

## Overview

Comprehensive risk management, fraud detection, responsible gaming, and regulatory compliance framework for the Benjamin Casino & Sports Betting Platform.

---

## 1. Risk Assessment Framework

### 1.1 Platform Risk Categories

```javascript
// backend/src/services/riskAssessment.js

class RiskAssessmentEngine {
  riskCategories = {
    // Market Risk
    ODDS_ANOMALY: { severity: 'high', category: 'market' },
    UNUSUAL_VOLUME: { severity: 'high', category: 'market' },
    SHARP_BETTING: { severity: 'medium', category: 'market' },
    PRICE_MANIPULATION: { severity: 'critical', category: 'market' },
    
    // Player Risk
    PROBLEM_GAMBLING: { severity: 'high', category: 'player' },
    UNDERAGE_BETTING: { severity: 'critical', category: 'player' },
    ACCOUNT_TAKEOVER: { severity: 'critical', category: 'player' },
    SUSPICIOUS_ACTIVITY: { severity: 'medium', category: 'player' },
    
    // Fraud Risk
    MATCH_FIXING: { severity: 'critical', category: 'fraud' },
    COLLUSION: { severity: 'high', category: 'fraud' },
    BONUS_ABUSE: { severity: 'medium', category: 'fraud' },
    PAYMENT_FRAUD: { severity: 'high', category: 'fraud' },
    
    // Operational Risk
    SYSTEM_OUTAGE: { severity: 'high', category: 'operational' },
    DATA_BREACH: { severity: 'critical', category: 'operational' },
    API_FAILURE: { severity: 'medium', category: 'operational' },
    
    // Regulatory Risk
    COMPLIANCE_BREACH: { severity: 'critical', category: 'regulatory' },
    KYC_FAILURE: { severity: 'high', category: 'regulatory' },
    AML_VIOLATION: { severity: 'critical', category: 'regulatory' }
  };

  // Assess overall platform risk score (0-100)
  assessPlatformRisk(metrics) {
    const {
      totalExposure,        // Total potential losses
      concentrationRatio,   // % of bets on single outcome
      apiHealthScore,       // External API availability
      fraudAlertCount,      // Active fraud investigations
      complianceIssues      // Outstanding compliance items
    } = metrics;

    let riskScore = 0;

    // Exposure Risk (0-30 points)
    const exposureRisk = Math.min(30, (totalExposure / 10000000) * 30);
    riskScore += exposureRisk;

    // Concentration Risk (0-25 points)
    const concentrationRisk = Math.min(25, (concentrationRatio - 0.5) * 50);
    riskScore += concentrationRisk;

    // Operational Risk (0-20 points)
    const operationalRisk = (1 - apiHealthScore) * 20;
    riskScore += operationalRisk;

    // Fraud Risk (0-15 points)
    const fraudRisk = Math.min(15, fraudAlertCount * 2);
    riskScore += fraudRisk;

    // Compliance Risk (0-10 points)
    const complianceRisk = Math.min(10, complianceIssues * 1);
    riskScore += complianceRisk;

    return {
      riskScore: Math.round(riskScore),
      riskLevel: this.getRiskLevel(riskScore),
      components: {
        exposure: exposureRisk,
        concentration: concentrationRisk,
        operational: operationalRisk,
        fraud: fraudRisk,
        compliance: complianceRisk
      },
      recommendations: this.generateRecommendations(riskScore)
    };
  }

  getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'MINIMAL';
  }

  generateRecommendations(score) {
    const recommendations = [];

    if (score >= 80) {
      recommendations.push('IMMEDIATE ACTION REQUIRED: Halt new bets');
      recommendations.push('Activate emergency response team');
      recommendations.push('Notify regulatory authorities if applicable');
    }

    if (score >= 60) {
      recommendations.push('Implement position limits');
      recommendations.push('Increase monitoring frequency');
      recommendations.push('Review large bet requests manually');
    }

    if (score >= 40) {
      recommendations.push('Enhanced due diligence on new players');
      recommendations.push('Monitor correlation of bets');
      recommendations.push('Daily risk reporting');
    }

    return recommendations;
  }
}

module.exports = new RiskAssessmentEngine();
```

---

## 2. Exposure Management

### 2.1 Position Limits & Hedging

```javascript
// backend/src/services/exposureManager.js

class ExposureManager {
  // Maximum exposure limits
  exposureLimits = {
    // Per-market limits
    maxPerMarket: 5000000,           // $5M max exposure per market
    maxPerSport: 50000000,           // $50M max per sport
    maxPerTeam: 25000000,            // $25M max per team
    maxPerPlayer: 10000000,          // $10M max per player prop
    
    // Concentration limits
    maxConcentration: 0.25,          // Max 25% of portfolio on single outcome
    maxCorrelation: 0.8,             // Max correlation between bets
    
    // Player limits
    maxBetPerPlayer: 500000,         // $500K max bet per player
    maxDailyPerPlayer: 5000000       // $5M max daily per player
  };

  // Calculate current exposure
  async calculateExposure(marketId, outcome) {
    const bets = await this.getBetsForOutcome(marketId, outcome);
    
    const exposure = {
      totalBetsPlaced: bets.reduce((sum, b) => sum + b.amount, 0),
      potentialLiability: bets.reduce((sum, b) => sum + (b.amount * b.odds), 0),
      numberOfBets: bets.length,
      largestBet: Math.max(...bets.map(b => b.amount)),
      averageBet: bets.reduce((sum, b) => sum + b.amount, 0) / bets.length,
      
      // Risk metrics
      concentrationRatio: (Math.max(...bets.map(b => b.amount)) / 
                          bets.reduce((sum, b) => sum + b.amount, 0)),
      kellyFraction: this.calculateKellyFraction(bets)
    };

    return exposure;
  }

  // Kelly Criterion for optimal bet sizing
  calculateKellyFraction(bets) {
    // Kelly = (bp - q) / b
    // b = odds - 1, p = win probability, q = 1 - p
    
    let totalKelly = 0;
    for (const bet of bets) {
      const b = bet.odds - 1;
      const p = 1 / bet.odds;
      const q = 1 - p;
      const kelly = (b * p - q) / b;
      totalKelly += kelly;
    }

    return Math.max(0, totalKelly / bets.length); // Never negative
  }

  // Check if bet violates exposure limits
  async validateBetAgainstLimits(userId, marketId, outcome, betAmount, odds) {
    const checks = {
      playerDailyLimit: await this.checkPlayerDailyLimit(userId, betAmount),
      playerBetLimit: await this.checkPlayerBetLimit(userId, betAmount),
      marketExposure: await this.checkMarketExposure(marketId, outcome, betAmount),
      singleOutcomeConcentration: await this.checkConcentration(marketId, outcome),
      correlationCheck: await this.checkBetCorrelation(userId, marketId, outcome),
      sharpe: await this.checkSharpeRatio(marketId, outcome, odds)
    };

    const violations = Object.entries(checks)
      .filter(([_, result]) => !result.allowed)
      .map(([check, result]) => ({
        check,
        reason: result.reason,
        currentValue: result.currentValue,
        limit: result.limit
      }));

    return {
      allowed: violations.length === 0,
      violations,
      recommendations: this.getRecommendations(violations)
    };
  }

  async checkPlayerDailyLimit(userId, betAmount) {
    const dailyBets = await this.getUserDailyBets(userId);
    const dailyTotal = dailyBets.reduce((sum, b) => sum + b.amount, 0);

    return {
      allowed: (dailyTotal + betAmount) <= this.exposureLimits.maxDailyPerPlayer,
      currentValue: dailyTotal,
      limit: this.exposureLimits.maxDailyPerPlayer,
      reason: `Daily limit exceeded: ${dailyTotal} + ${betAmount}`
    };
  }

  async checkPlayerBetLimit(userId, betAmount) {
    return {
      allowed: betAmount <= this.exposureLimits.maxBetPerPlayer,
      currentValue: betAmount,
      limit: this.exposureLimits.maxBetPerPlayer,
      reason: 'Individual bet exceeds limit'
    };
  }

  async checkMarketExposure(marketId, outcome, betAmount) {
    const exposure = await this.calculateExposure(marketId, outcome);

    return {
      allowed: (exposure.potentialLiability + (betAmount * this.getOdds(marketId, outcome))) <= 
               this.exposureLimits.maxPerMarket,
      currentValue: exposure.potentialLiability,
      limit: this.exposureLimits.maxPerMarket,
      reason: 'Market exposure limit would be exceeded'
    };
  }

  async checkConcentration(marketId, outcome) {
    const exposure = await this.calculateExposure(marketId, outcome);

    return {
      allowed: exposure.concentrationRatio <= this.exposureLimits.maxConcentration,
      currentValue: exposure.concentrationRatio,
      limit: this.exposureLimits.maxConcentration,
      reason: 'Too much concentration on single outcome'
    };
  }

  async checkBetCorrelation(userId, marketId, outcome) {
    const userBets = await this.getUserActiveBets(userId);
    const correlations = userBets.map(bet => 
      this.calculateBetCorrelation(bet, { marketId, outcome })
    );

    const maxCorr = Math.max(...correlations);

    return {
      allowed: maxCorr <= this.exposureLimits.maxCorrelation,
      currentValue: maxCorr,
      limit: this.exposureLimits.maxCorrelation,
      reason: 'Bet is too correlated with existing positions'
    };
  }

  async checkSharpeRatio(marketId, outcome, odds) {
    // Sharpe ratio = (expected return - risk-free rate) / volatility
    const expectedValue = (1 / odds) - 1; // Simplified
    const volatility = this.estimateVolatility(marketId);
    const riskFreeRate = 0.02; // 2% annual

    const sharpeRatio = (expectedValue - riskFreeRate) / volatility;

    return {
      allowed: sharpeRatio >= 0, // Positive expected value
      currentValue: sharpeRatio.toFixed(4),
      limit: '> 0.0',
      reason: 'Bet has negative expected value'
    };
  }

  getRecommendations(violations) {
    const recommendations = [];

    violations.forEach(violation => {
      switch (violation.check) {
        case 'playerDailyLimit':
          recommendations.push('Reduce bet amount or wait until next day');
          break;
        case 'playerBetLimit':
          recommendations.push('Split bet into smaller amounts');
          break;
        case 'marketExposure':
          recommendations.push('Market has reached maximum exposure. Try another market.');
          break;
        case 'singleOutcomeConcentration':
          recommendations.push('Too concentrated. Diversify your bets.');
          break;
        case 'correlationCheck':
          recommendations.push('This bet is too similar to your existing positions');
          break;
        case 'sharpe':
          recommendations.push('This bet has poor risk-adjusted return. Consider alternatives.');
          break;
      }
    });

    return recommendations;
  }
}

module.exports = new ExposureManager();
```

### 2.2 Dynamic Bet Limits Based on Risk

```javascript
// backend/src/services/dynamicLimitEngine.js

class DynamicLimitEngine {
  /**
   * Adjust limits based on current platform risk
   * Higher platform risk = lower user limits
   */

  async calculateUserLimits(userId, platformRiskScore) {
    const baseUserProfile = await this.getUserProfile(userId);
    
    // Risk multipliers (0-1)
    const riskMultiplier = {
      CRITICAL: 0.1,  // 90% reduction
      HIGH: 0.3,      // 70% reduction
      MEDIUM: 0.6,    // 40% reduction
      LOW: 0.8,       // 20% reduction
      MINIMAL: 1.0    // No reduction
    }[this.getRiskLevel(platformRiskScore)];

    // Base limits based on user tier
    const baseLimits = {
      newPlayer: { daily: 1000, perBet: 100 },
      regular: { daily: 10000, perBet: 1000 },
      vip: { daily: 100000, perBet: 10000 },
      whale: { daily: 1000000, perBet: 100000 }
    }[baseUserProfile.tier];

    // Apply risk adjustment
    const adjustedLimits = {
      dailyLimit: Math.round(baseLimits.daily * riskMultiplier),
      perBetLimit: Math.round(baseLimits.perBet * riskMultiplier),
      adjustmentReason: `Platform risk level: ${this.getRiskLevel(platformRiskScore)}`,
      previousLimits: baseLimits,
      riskAdjustment: (1 - riskMultiplier) * 100 // % reduction
    };

    return adjustedLimits;
  }

  getRiskLevel(score) {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 40) return 'MEDIUM';
    if (score >= 20) return 'LOW';
    return 'MINIMAL';
  }
}

module.exports = new DynamicLimitEngine();
```

---

## 3. Fraud Detection & Prevention

### 3.1 Multi-Layer Fraud Detection

```javascript
// backend/src/services/fraudDetectionEngine.js

const ML = require('ml-kit'); // Machine Learning library

class FraudDetectionEngine {
  async analyzeBetForFraud(userId, bet, context) {
    const signals = {
      // Behavioral analysis
      behavioralRisk: await this.analyzeBehavior(userId, bet),
      
      // Account analysis
      accountRisk: await this.analyzeAccount(userId),
      
      // Bet pattern analysis
      patternRisk: await this.analyzeBetPattern(userId, bet),
      
      // Velocity checks
      velocityRisk: await this.analyzeVelocity(userId),
      
      // Geographic checks
      geoRisk: await this.analyzeGeography(userId, context),
      
      // Payment method checks
      paymentRisk: await this.analyzePayment(userId, bet),
      
      // Collusion detection
      collusionRisk: await this.detectCollusion(userId, bet),
      
      // Match fixing signals
      matchFixingRisk: await this.detectMatchFixing(bet)
    };

    return this.compileFraudScore(signals);
  }

  async analyzeBehavior(userId, bet) {
    const userHistory = await this.getUserBettingHistory(userId);
    const profile = await this.getUserProfile(userId);

    // Red flags
    const redFlags = [];

    // Sudden change in betting pattern
    if (bet.amount > userHistory.averageBet * 5) {
      redFlags.push('unusually_large_bet');
    }

    // Betting on unusual markets for this user
    if (!userHistory.usualSports.includes(bet.sport)) {
      redFlags.push('unusual_sport_selection');
    }

    // Betting against usual pattern
    if (profile.winRate > 0.6 && !bet.expectedToWin) {
      redFlags.push('counter_to_pattern');
    }

    // Rapid consecutive bets
    const recentBets = await this.getRecentBets(userId, 5); // last 5 minutes
    if (recentBets.length > 10) {
      redFlags.push('rapid_betting_velocity');
    }

    return {
      riskScore: redFlags.length * 15,
      flags: redFlags,
      severity: redFlags.length > 3 ? 'high' : 'medium'
    };
  }

  async analyzeAccount(userId) {
    const account = await this.getAccountDetails(userId);
    const redFlags = [];

    // Recently created account
    const daysSinceCreation = (Date.now() - account.createdAt) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) {
      redFlags.push('new_account');
    }

    // Missing verification
    if (!account.emailVerified || !account.phoneVerified) {
      redFlags.push('incomplete_verification');
    }

    // KYC not completed
    if (!account.kycCompleted) {
      redFlags.push('kyc_not_completed');
    }

    // Multiple accounts from same IP
    const sameIPAccounts = await this.getAccountsByIP(account.lastIP);
    if (sameIPAccounts.length > 5) {
      redFlags.push('multiple_accounts_same_ip');
    }

    // Failed login attempts
    if (account.failedLoginAttempts > 3) {
      redFlags.push('multiple_failed_logins');
    }

    return {
      riskScore: redFlags.length * 20,
      flags: redFlags,
      severity: redFlags.length > 2 ? 'high' : 'medium'
    };
  }

  async analyzeBetPattern(userId, bet) {
    const userBets = await this.getUserBettingHistory(userId);
    const correlatedBets = await this.findCorrelatedBets(bet);

    const redFlags = [];

    // Coordinated betting with other users
    if (correlatedBets.length > 10) {
      redFlags.push('coordinated_betting_pattern');
    }

    // Always betting maximum on same outcome
    const maxBetsOnOutcome = userBets.filter(b => 
      b.outcome === bet.outcome && b.amount === this.exposureLimits.maxBetPerPlayer
    ).length;
    if (maxBetsOnOutcome / userBets.length > 0.5) {
      redFlags.push('always_max_bet_same_outcome');
    }

    // Betting exclusively on underdogs with high odds
    const underdogBets = userBets.filter(b => b.odds > 3 && b.expectedToWin < 0.4);
    if (underdogBets.length / userBets.length > 0.8) {
      redFlags.push('underdog_bias');
    }

    return {
      riskScore: redFlags.length * 18,
      flags: redFlags,
      severity: redFlags.length > 2 ? 'high' : 'medium'
    };
  }

  async analyzeVelocity(userId) {
    const redFlags = [];

    // Bets per minute
    const betsPerMinute = await this.getBetsPerMinute(userId);
    if (betsPerMinute > 2) {
      redFlags.push('high_betting_velocity');
    }

    // Deposits per day
    const depositsPerDay = await this.getDepositsPerDay(userId);
    if (depositsPerDay > 5) {
      redFlags.push('multiple_deposits_per_day');
    }

    // Rapid cashouts
    const cashoutFrequency = await this.getCashoutFrequency(userId);
    if (cashoutFrequency > 0.5) { // More than 50% of bets cashed out immediately
      redFlags.push('rapid_cashout_pattern');
    }

    return {
      riskScore: redFlags.length * 17,
      flags: redFlags,
      severity: redFlags.length > 1 ? 'high' : 'medium'
    };
  }

  async analyzeGeography(userId, context) {
    const redFlags = [];
    const userGeo = await this.getUserGeography(userId);
    const betGeo = context.ipGeolocation;

    // IP mismatch with registered location
    if (userGeo.country !== betGeo.country) {
      redFlags.push('geographic_mismatch');
    }

    // VPN/Proxy detection
    if (context.isVPN || context.isProxy) {
      redFlags.push('vpn_proxy_detected');
    }

    // Impossible travel (bet from two locations too quickly)
    const previousBetGeo = await this.getPreviousBetGeography(userId);
    if (previousBetGeo) {
      const distance = this.calculateDistance(userGeo, previousBetGeo);
      const timeDiff = (Date.now() - previousBetGeo.timestamp) / 1000 / 60; // minutes
      const minTravelTime = distance / 900; // 900 km/h max travel speed
      
      if (minTravelTime > timeDiff) {
        redFlags.push('impossible_travel');
      }
    }

    return {
      riskScore: redFlags.length * 25,
      flags: redFlags,
      severity: redFlags.length > 1 ? 'high' : 'critical'
    };
  }

  async analyzePayment(userId, bet) {
    const redFlags = [];
    const payment = await this.getPaymentMethod(userId);

    // New payment method
    const daysSinceBound = (Date.now() - payment.boundDate) / (1000 * 60 * 60 * 24);
    if (daysSinceBound < 1) {
      redFlags.push('new_payment_method');
    }

    // Payment amount unusual
    if (bet.depositAmount > payment.usualAmount * 3) {
      redFlags.push('unusual_deposit_amount');
    }

    // High-risk payment method
    if (['prepaid_card', 'cryptocurrency'].includes(payment.type)) {
      redFlags.push('high_risk_payment_type');
    }

    // Chargeback history
    if (payment.chargebackCount > 0) {
      redFlags.push('previous_chargebacks');
    }

    return {
      riskScore: redFlags.length * 22,
      flags: redFlags,
      severity: redFlags.length > 2 ? 'high' : 'medium'
    };
  }

  async detectCollusion(userId, bet) {
    // Find users with suspiciously similar betting patterns
    const similarUsers = await this.findSimilarBettingPatterns(userId);
    
    const redFlags = [];

    if (similarUsers.length > 5) {
      redFlags.push('potential_collusion_ring');
    }

    // Check if betting together on same markets
    const commonMarkets = await this.getCommonMarketBets(userId, similarUsers);
    if (commonMarkets.length > 10) {
      redFlags.push('coordinated_market_selection');
    }

    return {
      riskScore: redFlags.length * 30,
      flags: redFlags,
      suspiciousUsers: similarUsers.slice(0, 5),
      severity: redFlags.length > 0 ? 'high' : 'low'
    };
  }

  async detectMatchFixing(bet) {
    const redFlags = [];

    // Check for suspicious odds movement before game
    const preGameOdds = await this.getHistoricalOdds(bet.marketId, 1); // 1 hour before
    const oddsMovement = Math.abs(preGameOdds - bet.odds) / preGameOdds;

    if (oddsMovement > 0.2) { // > 20% movement
      redFlags.push('unusual_odds_movement');
    }

    // Check for unusual betting volume before game
    const preGameVolume = await this.getHistoricalVolume(bet.marketId, 1);
    const volumeSpike = bet.volume / preGameVolume;

    if (volumeSpike > 5) { // 5x normal volume
      redFlags.push('volume_spike_before_event');
    }

    // Check for sharp bettor activity
    const sharpBets = await this.detectSharpBetting(bet.marketId);
    if (sharpBets.length > 20) {
      redFlags.push('excessive_sharp_betting');
    }

    // Check event participants for previous fixing allegations
    const eventParticipants = await this.getEventParticipants(bet.marketId);
    const flaggedParticipants = eventParticipants.filter(p => p.matchFixingHistory);
    
    if (flaggedParticipants.length > 0) {
      redFlags.push('participants_with_fixing_history');
    }

    return {
      riskScore: redFlags.length * 35,
      flags: redFlags,
      severity: redFlags.length > 1 ? 'critical' : 'low'
    };
  }

  compileFraudScore(signals) {
    const weights = {
      behavioralRisk: 0.20,
      accountRisk: 0.15,
      patternRisk: 0.20,
      velocityRisk: 0.15,
      geoRisk: 0.15,
      paymentRisk: 0.10,
      collusionRisk: 0.25,
      matchFixingRisk: 0.30
    };

    let totalScore = 0;
    let maxSeverity = 'low';

    for (const [risk, weight] of Object.entries(weights)) {
      totalScore += (signals[risk].riskScore || 0) * weight;
      
      const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
      const currentSeverity = severityLevels[signals[risk].severity || 'low'];
      const maxLevelValue = severityLevels[maxSeverity];
      
      if (currentSeverity > maxLevelValue) {
        maxSeverity = Object.keys(severityLevels).find(k => severityLevels[k] === currentSeverity);
      }
    }

    // Normalize to 0-100
    totalScore = Math.min(100, Math.round(totalScore / 10));

    const action = {
      0: 'allow',
      1: 'allow',
      2: 'allow',
      3: 'monitor',
      4: 'review',
      5: 'review',
      6: 'decline',
      7: 'decline',
      8: 'investigate',
      9: 'investigate',
      10: 'block'
    }[Math.round(totalScore / 10)];

    return {
      fraudScore: totalScore,
      riskLevel: maxSeverity,
      action,
      signals,
      timestamp: new Date(),
      requiresManualReview: totalScore > 60
    };
  }

  calculateDistance(geo1, geo2) {
    // Haversine formula for distance between two coordinates
    const R = 6371; // Earth's radius in km
    const lat1 = geo1.latitude * Math.PI / 180;
    const lat2 = geo2.latitude * Math.PI / 180;
    const dLat = (geo2.latitude - geo1.latitude) * Math.PI / 180;
    const dLng = (geo2.longitude - geo1.longitude) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

module.exports = new FraudDetectionEngine();
```

---

## 4. Responsible Gaming Tools

### 4.1 Problem Gambling Detection & Intervention

```javascript
// backend/src/services/responsibleGaming.js

class ResponsibleGamingManager {
  // Gambling addiction risk indicators
  riskIndicators = [
    'increasing_bet_amounts',
    'chasing_losses',
    'playing_longer_than_intended',
    'hiding_gambling',
    'neglecting_responsibilities',
    'borrowing_to_gamble',
    'unsuccessful_quit_attempts',
    'withdrawal_symptoms',
    'tolerance_increase'
  ];

  async assessProblemGamblingRisk(userId) {
    const profile = await this.getUserProfile(userId);
    const betHistory = await this.getUserBettingHistory(userId);
    const alerts = [];

    // Check for rapid spending increase
    const last7DaysAvg = this.calculateAverage(betHistory.slice(-7));
    const previous7DaysAvg = this.calculateAverage(betHistory.slice(-14, -7));
    
    if (last7DaysAvg > previous7DaysAvg * 1.5) {
      alerts.push({
        indicator: 'increasing_bet_amounts',
        severity: 'warning',
        detail: `Betting increased ${((last7DaysAvg / previous7DaysAvg - 1) * 100).toFixed(1)}% week-over-week`
      });
    }

    // Check for chasing losses
    const losingStreak = this.detectLosingStreak(betHistory);
    if (losingStreak.length > 10) {
      const totalLosses = losingStreak.reduce((sum, b) => sum + b.amount, 0);
      const recoveryBets = betHistory.filter(b => 
        b.timestamp > losingStreak[0].timestamp &&
        b.amount > profile.averageBet * 2
      );

      if (recoveryBets.length > losingStreak.length * 0.3) {
        alerts.push({
          indicator: 'chasing_losses',
          severity: 'critical',
          detail: `Lost $${totalLosses.toLocaleString()} and increased bet sizes by ${(recoveryBets[0].amount / profile.averageBet).toFixed(1)}x`
        });
      }
    }

    // Check for time spent
    const timeSpent = await this.calculateTimeSpent(userId);
    if (timeSpent.dailyAverage > 8) {
      alerts.push({
        indicator: 'playing_longer_than_intended',
        severity: 'warning',
        detail: `Average daily playtime: ${timeSpent.dailyAverage.toFixed(1)} hours`
      });
    }

    // Check for session duration patterns
    const sessionLengths = await this.getSessionLengths(userId);
    const lengthIncrease = sessionLengths.recent / sessionLengths.historical;
    
    if (lengthIncrease > 1.5) {
      alerts.push({
        indicator: 'playing_longer_than_intended',
        severity: 'warning',
        detail: `Session duration increased ${((lengthIncrease - 1) * 100).toFixed(1)}%`
      });
    }

    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(alerts, profile);

    return {
      riskLevel: this.getRiskLevel(riskScore),
      riskScore,
      alerts,
      recommendations: this.generateRecommendations(riskScore),
      timestamp: new Date()
    };
  }

  calculateRiskScore(alerts, profile) {
    const severityWeights = {
      low: 10,
      warning: 25,
      critical: 50
    };

    const score = alerts.reduce((sum, alert) => 
      sum + (severityWeights[alert.severity] || 0), 0
    );

    // Adjust for frequency (more alerts = higher risk)
    return Math.min(100, score * (1 + alerts.length * 0.1));
  }

  getRiskLevel(score) {
    if (score >= 75) return 'CRITICAL_RISK';
    if (score >= 50) return 'HIGH_RISK';
    if (score >= 25) return 'MODERATE_RISK';
    return 'LOW_RISK';
  }

  generateRecommendations(riskScore) {
    const recommendations = [];

    if (riskScore >= 75) {
      recommendations.push({
        level: 'critical',
        action: 'Account Suspension Recommended',
        detail: 'Automatic account suspension for 30 days recommended',
        resources: ['National Problem Gambling Helpline', 'Therapy Resources', 'Financial Counseling']
      });
    }

    if (riskScore >= 50) {
      recommendations.push({
        level: 'high',
        action: 'Set Strict Limits',
        detail: 'Lower daily/weekly betting limits automatically applied',
        resources: ['Self-Exclusion Program', 'Gambling Addiction Support']
      });
    }

    if (riskScore >= 25) {
      recommendations.push({
        level: 'moderate',
        action: 'Enable Responsible Gaming Features',
        detail: 'Consider using deposit limits, betting limits, and session time limits',
        resources: ['Gambling Awareness', 'Self-Assessment Tools']
      });
    }

    return recommendations;
  }

  // Enforced responsible gaming tools
  async applyResponsibleGamingLimits(userId, userChoice) {
    return {
      depositLimit: {
        daily: userChoice.dailyDeposit || 100,
        weekly: userChoice.weeklyDeposit || 500,
        monthly: userChoice.monthlyDeposit || 2000
      },
      betLimit: {
        perBet: userChoice.maxBet || 50,
        daily: userChoice.dailyBet || 500
      },
      sessionLimit: {
        maxDuration: userChoice.maxSessionMinutes || 60,
        warningAfter: userChoice.warningMinutes || 50
      },
      timeOut: {
        duration: userChoice.timeOutDays || 7, // Voluntary self-exclusion
        renewable: true
      },
      selfExclude: {
        duration: userChoice.selfExcludeDays || 30, // Longer-term exclusion
        allPlatforms: userChoice.crossPlatform || false
      },
      lossLimit: {
        daily: userChoice.maxLossDaily || null,
        weekly: userChoice.maxLossWeekly || null,
        monthly: userChoice.maxLossMonthly || null
      }
    };
  }

  detectLosingStreak(betHistory) {
    let streak = [];
    
    for (const bet of betHistory) {
      if (!bet.won) {
        streak.push(bet);
      } else {
        if (streak.length > 0) break;
      }
    }
    
    return streak;
  }

  calculateAverage(data) {
    return data.length > 0 ? data.reduce((sum, item) => sum + item.amount, 0) / data.length : 0;
  }
}

module.exports = new ResponsibleGamingManager();
```

---

## 5. Regulatory Compliance

### 5.1 KYC/AML Framework

```javascript
// backend/src/services/complianceManager.js

class ComplianceManager {
  // KYC Levels
  kycLevels = {
    0: { name: 'Unverified', limits: { dailyBet: 100, monthlyTransaction: 500 } },
    1: { name: 'Basic', limits: { dailyBet: 5000, monthlyTransaction: 50000 } },
    2: { name: 'Standard', limits: { dailyBet: 50000, monthlyTransaction: 500000 } },
    3: { name: 'Enhanced', limits: { dailyBet: null, monthlyTransaction: null } }
  };

  async performKYC(userId, documents) {
    const verification = {
      identity: await this.verifyIdentity(documents.idDocument),
      address: await this.verifyAddress(documents.proofOfAddress),
      sourceOfFunds: await this.verifySourceOfFunds(documents.bankStatement),
      politicallyExposed: await this.checkPEP(documents.idDocument),
      sanctions: await this.checkSanctionsList(documents.idDocument),
      ageVerification: await this.verifyAge(documents.idDocument)
    };

    const kycLevel = this.calculateKYCLevel(verification);
    const riskLevel = this.assessAMLRisk(verification);

    return {
      verified: Object.values(verification).every(v => v.verified === true),
      kycLevel,
      riskLevel,
      checks: verification,
      timestamp: new Date(),
      expiryDate: this.addMonths(new Date(), 12) // Annual refresh
    };
  }

  async checkSanctionsList(identity) {
    // Check against OFAC, EU, UN sanctions lists
    const fullName = `${identity.firstName} ${identity.lastName}`;
    
    // Simplified check (use actual API in production)
    const sanctioned = await this.queryMultipleSanctionsDatabases(fullName);

    return {
      verified: !sanctioned,
      status: sanctioned ? 'MATCH_FOUND' : 'NO_MATCH',
      databases: ['OFAC', 'EU_Consolidated', 'UN_Security_Council']
    };
  }

  async checkPEP(identity) {
    // Politically Exposed Person check
    const isPEP = await this.queryPEPDatabase(
      identity.firstName,
      identity.lastName,
      identity.dateOfBirth,
      identity.nationality
    );

    return {
      verified: !isPEP,
      status: isPEP ? 'PEP_MATCH' : 'NOT_PEP',
      requires_enhanced_monitoring: isPEP
    };
  }

  assessAMLRisk(verification) {
    const redFlags = [];

    if (verification.sourceOfFunds.suspicious) {
      redFlags.push('suspicious_source_of_funds');
    }

    if (verification.politicallyExposed.requires_enhanced_monitoring) {
      redFlags.push('politically_exposed');
    }

    if (verification.address.highRiskCountry) {
      redFlags.push('high_risk_jurisdiction');
    }

    return {
      riskLevel: redFlags.length > 2 ? 'HIGH' : 'LOW',
      flags: redFlags,
      requiresMonitoring: redFlags.length > 0
    };
  }

  async monitorTransactions(userId, transaction) {
    const anomalies = [];

    // Check transaction size
    const userProfile = await this.getUserProfile(userId);
    if (transaction.amount > userProfile.averageTransaction * 3) {
      anomalies.push('unusual_transaction_size');
    }

    // Check velocity
    const dayTransactions = await this.getDayTransactions(userId);
    if (dayTransactions.count > 10) {
      anomalies.push('high_transaction_velocity');
    }

    // Check structuring (multiple transactions to avoid threshold)
    const recentTransactions = await this.getRecentTransactions(userId, 7);
    const total = recentTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    if (total > 10000 && recentTransactions.length > 5 && 
        Math.all(recentTransactions, t => t.amount < 2000)) {
      anomalies.push('structuring_suspicious_pattern');
    }

    if (anomalies.length > 0) {
      await this.fileAML_Report(userId, transaction, anomalies);
    }

    return {
      passed: anomalies.length === 0,
      anomalies,
      reportFiled: anomalies.length > 0
    };
  }

  async fileAML_Report(userId, transaction, anomalies) {
    const report = {
      reportId: this.generateReportID(),
      filedDate: new Date(),
      userId,
      transaction,
      anomalies,
      severity: anomalies.length > 2 ? 'HIGH' : 'MEDIUM',
      regulatoryBody: process.env.REGULATORY_BODY || 'FinCEN'
    };

    // File with regulatory authority
    await this.submitReport(report);
    
    return report;
  }
}

module.exports = new ComplianceManager();
```

---

## 6. Incident Response & Escalation

### 6.1 Automated Incident Handling

```javascript
// backend/src/services/incidentResponse.js

class IncidentResponseManager {
  incidentLevels = {
    INFO: 1,      // Log only
    WARNING: 2,   // Alert team
    CRITICAL: 3,  // Immediate action
    EMERGENCY: 4  // Full halt authority
  };

  async handleIncident(incidentType, details) {
    const incident = {
      id: this.generateIncidentID(),
      type: incidentType,
      severity: this.assessSeverity(incidentType),
      details,
      createdAt: new Date(),
      status: 'open'
    };

    // Log incident
    await this.logIncident(incident);

    // Determine actions based on severity
    const actions = this.getIncidentActions(incident.severity, incidentType);

    for (const action of actions) {
      await this.executeAction(action, incident);
    }

    // Notify relevant teams
    await this.notifyTeams(incident);

    return incident;
  }

  assessSeverity(incidentType) {
    const severityMap = {
      'UNAUTHORIZED_ACCESS': this.incidentLevels.EMERGENCY,
      'DATA_BREACH': this.incidentLevels.EMERGENCY,
      'PAYMENT_SYSTEM_DOWN': this.incidentLevels.CRITICAL,
      'FRAUD_DETECTED': this.incidentLevels.CRITICAL,
      'ODDS_ANOMALY': this.incidentLevels.CRITICAL,
      'MATCH_FIXING_SIGNAL': this.incidentLevels.CRITICAL,
      'AML_VIOLATION': this.incidentLevels.CRITICAL,
      'COMPLIANCE_BREACH': this.incidentLevels.WARNING,
      'API_FAILURE': this.incidentLevels.WARNING,
      'HIGH_RISK_BET': this.incidentLevels.INFO
    };

    return severityMap[incidentType] || this.incidentLevels.WARNING;
  }

  getIncidentActions(severity, type) {
    const actions = [];

    if (severity === this.incidentLevels.EMERGENCY) {
      actions.push({
        action: 'HALT_OPERATIONS',
        target: 'all',
        duration: 'until_resolved'
      });
      actions.push({
        action: 'ACTIVATE_INCIDENT_TEAM',
        level: 'ceo'
      });
      actions.push({
        action: 'NOTIFY_REGULATORS',
        body: 'all'
      });
    }

    if (severity === this.incidentLevels.CRITICAL) {
      actions.push({
        action: 'RESTRICT_AFFECTED_MARKETS',
        auto: true
      });
      actions.push({
        action: 'ACTIVATE_INCIDENT_TEAM',
        level: 'cto'
      });
      actions.push({
        action: 'ENABLE_ENHANCED_MONITORING',
        duration: 24 // hours
      });
    }

    return actions;
  }

  async executeAction(action, incident) {
    switch (action.action) {
      case 'HALT_OPERATIONS':
        await this.haltOperations(action.target);
        break;
      case 'RESTRICT_AFFECTED_MARKETS':
        await this.restrictMarkets(incident.details.affectedMarkets);
        break;
      case 'ACTIVATE_INCIDENT_TEAM':
        await this.activateIncidentTeam(action.level);
        break;
      case 'ENABLE_ENHANCED_MONITORING':
        await this.enableEnhancedMonitoring(action.duration);
        break;
      case 'NOTIFY_REGULATORS':
        await this.notifyRegulatories(action.body);
        break;
    }
  }

  async notifyTeams(incident) {
    const notifications = {
      [this.incidentLevels.EMERGENCY]: ['ceo', 'cto', 'cfo', 'compliance_officer', 'security_team'],
      [this.incidentLevels.CRITICAL]: ['cto', 'operations_lead', 'compliance_officer'],
      [this.incidentLevels.WARNING]: ['operations_lead', 'monitoring_team'],
      [this.incidentLevels.INFO]: ['monitoring_team']
    };

    const recipients = notifications[incident.severity] || [];

    for (const recipient of recipients) {
      await this.sendAlert({
        recipient,
        incident,
        channel: ['email', 'sms', 'slack'][Math.min(incident.severity - 1, 2)]
      });
    }
  }
}

module.exports = new IncidentResponseManager();
```

---

## 7. Risk Dashboard & Reporting

### 7.1 Real-Time Risk Monitoring

```javascript
// backend/src/routes/admin/riskDashboard.js

router.get('/api/admin/risk-dashboard', async (req, res) => {
  try {
    const platformMetrics = await riskAssessmentEngine.getPlatformMetrics();
    const riskAssessment = riskAssessmentEngine.assessPlatformRisk(platformMetrics);
    
    const dashboard = {
      timestamp: new Date(),
      platformRisk: riskAssessment,
      
      // Exposure metrics
      exposure: {
        totalLiability: platformMetrics.totalExposure,
        byMarket: await exposureManager.getMarketExposures(),
        bySport: await exposureManager.getSportExposures(),
        concentration: platformMetrics.concentrationRatio
      },

      // Fraud metrics
      fraud: {
        activeInvestigations: await fraudDetectionEngine.getActiveInvestigations(),
        suspiciousAccounts: await fraudDetectionEngine.getFlaggedAccounts(),
        matchFixingAlerts: await fraudDetectionEngine.getMatchFixingAlerts(),
        recentBlocks: await fraudDetectionEngine.getRecentBlockedBets()
      },

      // Problem gambling
      problemGambling: {
        criticalRisk: await responsibleGamingManager.getCriticalRiskPlayers(),
        highRisk: await responsibleGamingManager.getHighRiskPlayers(),
        interventionsNeeded: await responsibleGamingManager.getPendingInterventions()
      },

      // Compliance
      compliance: {
        kycPending: await complianceManager.getPendingKYC(),
        amlViolations: await complianceManager.getAMLViolations(),
        regulatoryDeadlines: await complianceManager.getUpcomingDeadlines()
      },

      // Incidents
      incidents: {
        open: await incidentResponseManager.getOpenIncidents(),
        recent: await incidentResponseManager.getRecentIncidents(7)
      }
    };

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Summary

**Complete Risk Management Coverage:**

✅ **Risk Assessment** - Platform-wide risk scoring
✅ **Exposure Management** - Position limits & dynamic adjustments
✅ **Fraud Detection** - Multi-layer AI-powered detection
✅ **Responsible Gaming** - Problem gambling prevention
✅ **Compliance** - KYC/AML framework
✅ **Incident Response** - Automated escalation & handling
✅ **Real-Time Monitoring** - Risk dashboard & alerts

---

**Last Updated**: 2026-07-15
**Platform**: Benjamin Casino & Sports Betting
