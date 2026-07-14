class RevenueCalculator {
  /**
   * Calculate house profit for a single bet
   */
  static calculateHouseProfit(betAmount, odds, won, gameType) {
    const houseEdges = {
      'dice': 0.05,
      'crash': 0.03,
      'mines': 0.05,
      'color': 0.05,
      'roulette': 0.027,
      'plinko': 0.05,
      'blackjack': 0.005,
      'slots': 0.08,
      'video-poker': 0.02,
      'keno': 0.40,
      'bingo': 0.20,
      'sports': 0.045
    };

    const houseEdge = houseEdges[gameType] || 0.05;
    
    if (won) {
      const payout = betAmount * odds;
      const actualPayout = payout * (1 - houseEdge);
      return betAmount - actualPayout;
    } else {
      return betAmount; // House keeps entire bet
    }
  }

  /**
   * Calculate daily revenue projections
   */
  static calculateDailyRevenue(dailyWagers, gameDistribution, houseEdges = {}) {
    let totalRevenue = 0;
    let breakdown = {};

    for (const [game, percentage] of Object.entries(gameDistribution)) {
      const wagers = dailyWagers * percentage;
      const edge = houseEdges[game] || 0.05;
      const revenue = wagers * edge;
      
      breakdown[game] = {
        wagers,
        edge,
        revenue
      };
      
      totalRevenue += revenue;
    }

    return {
      dailyWagers,
      totalRevenue,
      breakdown,
      monthlyRevenue: totalRevenue * 30,
      annualRevenue: totalRevenue * 365
    };
  }

  /**
   * Calculate user acquisition cost vs lifetime value
   */
  static calculateUAC_LTV(marketingSpend, avgUserDeposit, avgDailyWagers, daysActive, gameEdge = 0.06) {
    const uacPerUser = marketingSpend / (marketingSpend / avgUserDeposit); // Simple calc
    
    const totalWagered = avgDailyWagers * daysActive;
    const houseProfit = totalWagered * gameEdge;
    const ltv = houseProfit;
    
    return {
      uacPerUser,
      ltv,
      roi: ltv / uacPerUser,
      profitPerUser: ltv - uacPerUser,
      paybackPeriod: (uacPerUser / avgDailyWagers) + ' days'
    };
  }

  /**
   * Calculate bonus profitability
   */
  static calculateBonusROI(bonusAmount, wageringMultiplier, completionRate = 0.7, gameEdge = 0.06) {
    const wageringRequirement = bonusAmount * wageringMultiplier;
    const houseRevenueFromWagering = wageringRequirement * gameEdge;
    
    // Average: completionRate complete, (1-completionRate) don't and bonus voided
    const avgBonusCost = bonusAmount * completionRate;
    const totalWageredByNonCompleters = wageringRequirement * (1 - completionRate) * 0.4; // assume 40% wagering
    const additionalRevenue = totalWageredByNonCompleters * gameEdge;
    
    const netProfit = houseRevenueFromWagering + additionalRevenue - avgBonusCost;
    const roi = netProfit / bonusAmount;

    return {
      bonusAmount,
      avgBonusCost,
      wageringRequirement,
      houseRevenueFromWagering,
      netProfit,
      roi,
      roiPercentage: `${(roi * 100).toFixed(2)}%`
    };
  }

  /**
   * Calculate VIP tier profitability
   */
  static calculateVIPProfitability(monthlyWagers, tier) {
    const tiers = {
      'bronze': { monthlyBonus: 500, cashbackPct: 0.005, gameEdge: 0.06 },
      'silver': { monthlyBonus: 1500, cashbackPct: 0.01, gameEdge: 0.06 },
      'gold': { monthlyBonus: 5000, cashbackPct: 0.02, gameEdge: 0.06 },
      'platinum': { monthlyBonus: 15000, cashbackPct: 0.03, gameEdge: 0.06 },
      'diamond': { monthlyBonus: 50000, cashbackPct: 0.05, gameEdge: 0.06 }
    };

    const tierData = tiers[tier];
    const houseRevenue = monthlyWagers * tierData.gameEdge;
    const monthlyBonusCost = tierData.monthlyBonus;
    const cashbackCost = monthlyWagers * tierData.cashbackPct;
    const totalCosts = monthlyBonusCost + cashbackCost;
    
    const netProfit = houseRevenue - totalCosts;
    const roi = netProfit / monthlyWagers;

    return {
      tier,
      monthlyWagers,
      houseRevenue,
      monthlyBonusCost,
      cashbackCost,
      totalCosts,
      netProfit,
      roi: `${(roi * 100).toFixed(2)}%`
    };
  }

  /**
   * Calculate affiliate commission
   */
  static calculateAffiliateCommission(referralNetProfit, affiliateTier) {
    const commissionRates = {
      'tier1': 0.15,
      'tier2': 0.20,
      'tier3': 0.25,
      'tier4': 0.30,
      'tier5': 0.35
    };

    const commissionRate = commissionRates[affiliateTier];
    const commission = referralNetProfit * commissionRate;
    const houseProfit = referralNetProfit - commission;

    return {
      referralNetProfit,
      affiliateTier,
      commissionRate: `${(commissionRate * 100)}%`,
      affliateCommission: Math.round(commission * 100) / 100,
      houseProfit: Math.round(houseProfit * 100) / 100,
      houseROI: `${((houseProfit / commission) * 100).toFixed(2)}%`
    };
  }

  /**
   * Calculate monthly platform revenue
   */
  static calculateMonthlyPlatformRevenue(userBase, dailyActiveRate, avgDailyWager, gameDistribution) {
    const dailyActiveUsers = userBase * dailyActiveRate;
    const dailyTotalWagers = dailyActiveUsers * avgDailyWager;
    const dailyRevenue = this.calculateDailyRevenue(dailyTotalWagers, gameDistribution);
    
    const costs = {
      hosting: 5000,
      paymentProcessing: dailyTotalWagers * 30 * 0.02,
      support: 10000,
      marketing: 50000,
      compliance: 10000,
      bonuses: dailyTotalWagers * 30 * 0.1, // 10% of wagered amount
      operations: 5000
    };

    const monthlyRevenue = dailyRevenue.monthlyRevenue;
    const totalCosts = Object.values(costs).reduce((a, b) => a + b, 0);
    const netProfit = monthlyRevenue - totalCosts;

    return {
      userBase,
      dailyActiveUsers,
      dailyTotalWagers,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
      costs,
      totalCosts: Math.round(totalCosts * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMargin: `${((netProfit / monthlyRevenue) * 100).toFixed(2)}%`,
      costBreakdown: costs
    };
  }

  /**
   * Calculate break-even point
   */
  static calculateBreakEven(monthlyFixedCosts, avgHouseEdge = 0.06) {
    const breakEvenWagers = monthlyFixedCosts / avgHouseEdge;
    const breakEvenDaily = breakEvenWagers / 30;

    return {
      monthlyFixedCosts,
      breakEvenMonthlyWagers: Math.round(breakEvenWagers * 100) / 100,
      breakEvenDailyWagers: Math.round(breakEvenDaily * 100) / 100,
      avgHouseEdge: `${(avgHouseEdge * 100)}%`
    };
  }
}

module.exports = RevenueCalculator;
