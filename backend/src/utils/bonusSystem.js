class BonusSystem {
  static BONUS_TYPES = {
    'welcome': {
      type: 'welcome',
      name: 'Welcome Bonus',
      description: 'Get 100% match on first deposit up to ₹10,000',
      percentage: 100,
      maxAmount: 10000,
      minDeposit: 1000,
      wagering: 5
    },
    'reload': {
      type: 'reload',
      name: 'Reload Bonus',
      description: 'Get 50% match on deposits every Monday',
      percentage: 50,
      maxAmount: 5000,
      minDeposit: 1000,
      wagering: 3
    },
    'cashback': {
      type: 'cashback',
      name: 'Weekly Cashback',
      description: 'Get 10% cashback on losses every week',
      percentage: 10,
      maxAmount: 2000,
      wagering: 1
    },
    'referral': {
      type: 'referral',
      name: 'Referral Bonus',
      description: 'Get ₹500 for each friend who joins',
      fixedAmount: 500,
      wagering: 2
    },
    'birthday': {
      type: 'birthday',
      name: 'Birthday Bonus',
      description: '25% bonus on your birthday',
      percentage: 25,
      maxAmount: 5000,
      wagering: 3
    }
  };

  /**
   * Calculate bonus amount
   */
  static calculateBonus(bonusType, depositAmount, existingBalance = 0) {
    const bonus = this.BONUS_TYPES[bonusType];
    if (!bonus) return null;

    let bonusAmount = 0;

    if (bonus.percentage) {
      // Percentage-based bonus
      bonusAmount = depositAmount * (bonus.percentage / 100);
      
      // Cap at maximum
      if (bonus.maxAmount) {
        bonusAmount = Math.min(bonusAmount, bonus.maxAmount);
      }

      // Minimum deposit requirement
      if (bonus.minDeposit && depositAmount < bonus.minDeposit) {
        return null;
      }
    } else if (bonus.fixedAmount) {
      // Fixed bonus amount
      bonusAmount = bonus.fixedAmount;
    }

    // Calculate wagering requirement
    const wageringRequirement = (depositAmount + bonusAmount) * bonus.wagering;

    return {
      bonusType,
      bonusAmount: Math.round(bonusAmount * 100) / 100,
      totalBalance: depositAmount + bonusAmount,
      wageringRequirement,
      remainingWagering: wageringRequirement,
      expiryDays: 30,
      status: 'active'
    };
  }

  /**
   * Apply bonus to wallet
   */
  static applyBonus(currentBalance, bonusData) {
    return currentBalance + bonusData.bonusAmount;
  }

  /**
   * Update wagering requirement after bet
   */
  static updateWagering(betAmount, currentWagering) {
    return Math.max(0, currentWagering - betAmount);
  }

  /**
   * Check if bonus is redeemable
   */
  static canRedeemBonus(wageringRemaining) {
    return wageringRemaining <= 0;
  }
}

module.exports = BonusSystem;
