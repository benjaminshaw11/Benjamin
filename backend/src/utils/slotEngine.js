class SlotEngine {
  static SYMBOLS = {
    'cherry': 10,
    'lemon': 15,
    'orange': 15,
    'plum': 15,
    'bell': 20,
    'bar': 25,
    'seven': 50,
    'gold': 100
  };

  static REELS = 3;
  static COLUMNS = 5;

  /**
   * Spin reels
   * @param {number} random
   * @returns {object}
   */
  static spinReels(random) {
    const reels = [];
    let currentRandom = random;

    for (let i = 0; i < this.REELS; i++) {
      const symbols = Object.keys(this.SYMBOLS);
      const index = Math.floor(currentRandom * symbols.length);
      reels.push(symbols[index]);
      currentRandom = (currentRandom * 1103515245 + 12345) % 2147483648;
    }

    return { reels };
  }

  /**
   * Calculate payout
   * @param {array} reels
   * @returns {object}
   */
  static calculatePayout(reels) {
    const [reel1, reel2, reel3] = reels;

    // All three match
    if (reel1 === reel2 && reel2 === reel3) {
      const multiplier = this.SYMBOLS[reel1];
      return {
        won: true,
        pattern: 'three-of-a-kind',
        multiplier
      };
    }

    // Two match
    if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      return {
        won: true,
        pattern: 'two-of-a-kind',
        multiplier: 2
      };
    }

    return {
      won: false,
      pattern: 'no-match',
      multiplier: 0
    };
  }
}

module.exports = SlotEngine;
