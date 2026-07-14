class VIPSystem {
  static VIP_TIERS = {
    'bronze': {
      level: 1,
      name: 'Bronze',
      minPoints: 0,
      maxPoints: 999,
      monthlyBonus: 500,
      cashbackPercentage: 0.5,
      supportPriority: 'standard',
      rewards: ['50 bonus points on birthday']
    },
    'silver': {
      level: 2,
      name: 'Silver',
      minPoints: 1000,
      maxPoints: 4999,
      monthlyBonus: 1500,
      cashbackPercentage: 1,
      supportPriority: 'high',
      rewards: ['100 bonus points on birthday', 'Dedicated support', 'Weekly bonus']
    },
    'gold': {
      level: 3,
      name: 'Gold',
      minPoints: 5000,
      maxPoints: 14999,
      monthlyBonus: 5000,
      cashbackPercentage: 2,
      supportPriority: 'vip',
      rewards: ['500 bonus points on birthday', 'VIP support', 'Exclusive games', 'Higher limits']
    },
    'platinum': {
      level: 4,
      name: 'Platinum',
      minPoints: 15000,
      maxPoints: 49999,
      monthlyBonus: 15000,
      cashbackPercentage: 3,
      supportPriority: 'vip_platinum',
      rewards: ['1000 bonus points on birthday', 'Personal manager', 'Custom limits', 'Luxury rewards']
    },
    'diamond': {
      level: 5,
      name: 'Diamond',
      minPoints: 50000,
      maxPoints: Infinity,
      monthlyBonus: 50000,
      cashbackPercentage: 5,
      supportPriority: 'vip_diamond',
      rewards: ['5000 bonus points on birthday', 'Concierge service', 'Unlimited access', 'Exclusive invites']
    }
  };

  /**
   * Calculate points earned from bet
   * 1 point = ₹1 wagered
   */
  static calculatePoints(betAmount) {
    return Math.floor(betAmount);
  }

  /**
   * Get VIP tier by points
   */
  static getTierByPoints(points) {
    for (const [key, tier] of Object.entries(this.VIP_TIERS)) {
      if (points >= tier.minPoints && points <= tier.maxPoints) {
        return { key, ...tier };
      }
    }
    return null;
  }

  /**
   * Calculate monthly bonus
   */
  static getMonthlyBonus(tier) {
    return tier.monthlyBonus;
  }

  /**
   * Calculate cashback
   */
  static calculateCashback(lossAmount, tier) {
    return Math.round(lossAmount * (tier.cashbackPercentage / 100) * 100) / 100;
  }

  /**
   * Get next tier requirements
   */
  static getNextTierRequirements(currentPoints) {
    const tiers = Object.values(this.VIP_TIERS).sort((a, b) => a.minPoints - b.minPoints);
    const nextTier = tiers.find(t => t.minPoints > currentPoints);
    
    if (!nextTier) return null;
    
    return {
      tier: nextTier.name,
      pointsNeeded: nextTier.minPoints - currentPoints,
      totalPointsRequired: nextTier.minPoints
    };
  }

  /**
   * Calculate loyalty rewards
   */
  static calculateLoyaltyRewards(totalSpent, currentTier) {
    const rewards = {
      bonus: currentTier.monthlyBonus,
      cashback: this.calculateCashback(totalSpent, currentTier),
      vipPoints: Math.floor(totalSpent * 1.5),
      rewards: currentTier.rewards
    };
    return rewards;
  }
}

module.exports = VIPSystem;
