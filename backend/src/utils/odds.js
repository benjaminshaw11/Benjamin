class OddsCalculator {
  static CONFIG = {
    HOUSE_EDGE: 0.05,
    DICE_HOUSE_EDGE: 0.05,
    ROULETTE_HOUSE_EDGE: 0.027,
    CRASH_HOUSE_EDGE: 0.03,
    COLOR_HOUSE_EDGE: 0.05,
    MIN_POOL_FOR_ADJUSTMENT: 100
  };

  /**
   * Calculate decimal odds from probability
   * @param {number} probability
   * @param {boolean} applyHouseEdge
   * @returns {number}
   */
  static calculateOdds(probability, applyHouseEdge = true) {
    const fairOdds = 1 / probability;
    if (!applyHouseEdge) return fairOdds;
    return Math.round(fairOdds * (1 - this.CONFIG.HOUSE_EDGE) * 100) / 100;
  }

  /**
   * Calculate implied probability from odds
   * @param {number} odds
   * @returns {number}
   */
  static impliedProbability(odds) {
    return Math.round((1 / odds) * 100);
  }

  /**
   * Calculate payout
   * @param {number} amount
   * @param {number} odds
   * @returns {number}
   */
  static calculatePayout(amount, odds) {
    return Math.round(amount * odds * 100) / 100;
  }

  /**
   * Calculate profit
   * @param {number} amount
   * @param {number} odds
   * @returns {number}
   */
  static calculateProfit(amount, odds) {
    return Math.round((amount * odds - amount) * 100) / 100;
  }

  /**
   * Dynamically adjust odds based on pool imbalance
   * @param {number} baseOdds
   * @param {number} thisPool
   * @param {number} otherPool
   * @returns {number}
   */
  static adjustOdds(baseOdds, thisPool, otherPool) {
    const total = thisPool + otherPool;
    if (total < this.CONFIG.MIN_POOL_FOR_ADJUSTMENT) return baseOdds;

    const thisRatio = thisPool / total;
    const imbalance = thisRatio - 0.5;
    const adjustment = 1 - (imbalance * 0.2);

    return Math.round(Math.max(1.01, baseOdds * adjustment) * 100) / 100;
  }
}

module.exports = OddsCalculator;
