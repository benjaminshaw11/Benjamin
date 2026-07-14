class AffiliateSystem {
  static COMMISSION_RATES = {
    'tier1': {
      name: 'Tier 1',
      referrals: 0,
      commission: 0.15, // 15%
      monthlyBonus: 0
    },
    'tier2': {
      name: 'Tier 2',
      referrals: 5,
      commission: 0.20, // 20%
      monthlyBonus: 1000
    },
    'tier3': {
      name: 'Tier 3',
      referrals: 20,
      commission: 0.25, // 25%
      monthlyBonus: 5000
    },
    'tier4': {
      name: 'Tier 4',
      referrals: 50,
      commission: 0.30, // 30%
      monthlyBonus: 15000
    },
    'tier5': {
      name: 'Tier 5',
      referrals: 100,
      commission: 0.35, // 35%
      monthlyBonus: 50000
    }
  };

  /**
   * Generate referral code
   */
  static generateReferralCode(userId) {
    return `REF${userId.substring(0, 8).toUpperCase()}`;
  }

  /**
   * Calculate commission
   */
  static calculateCommission(referralNetProfit, affiliateCommissionRate) {
    return Math.round(referralNetProfit * affiliateCommissionRate * 100) / 100;
  }

  /**
   * Get affiliate tier by referrals
   */
  static getAffiliateTier(referralCount) {
    const tiers = Object.values(this.COMMISSION_RATES).reverse();
    for (const tier of tiers) {
      if (referralCount >= tier.referrals) {
        return tier;
      }
    }
    return this.COMMISSION_RATES.tier1;
  }

  /**
   * Calculate total earnings
   */
  static calculateTotalEarnings(referrals) {
    let totalCommission = 0;

    referrals.forEach(ref => {
      if (ref.status === 'active') {
        const tier = this.getAffiliateTier(ref.totalReferrals);
        totalCommission += this.calculateCommission(ref.netProfit, tier.commission);
      }
    });

    return totalCommission;
  }

  /**
   * Get next tier requirements
   */
  static getNextTierRequirements(currentReferrals) {
    const tiers = Object.values(this.COMMISSION_RATES).sort((a, b) => a.referrals - b.referrals);
    const nextTier = tiers.find(t => t.referrals > currentReferrals);
    
    if (!nextTier) return null;
    
    return {
      tier: nextTier.name,
      referralsNeeded: nextTier.referrals - currentReferrals,
      totalReferralsRequired: nextTier.referrals,
      commission: `${nextTier.commission * 100}%`,
      monthlyBonus: nextTier.monthlyBonus
    };
  }
}

module.exports = AffiliateSystem;
