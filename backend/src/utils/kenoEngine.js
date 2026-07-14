class KenoEngine {
  static SPOT_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  static TOTAL_NUMBERS = 80;
  static DRAW_COUNT = 20;

  /**
   * Generate winning numbers
   */
  static generateWinningNumbers(random) {
    const numbers = new Set();
    let currentRandom = random;

    while (numbers.size < this.DRAW_COUNT) {
      const num = Math.floor((currentRandom * 1000) % this.TOTAL_NUMBERS) + 1;
      numbers.add(num);
      currentRandom = (currentRandom * 1103515245 + 12345) % 2147483648;
    }

    return Array.from(numbers).sort((a, b) => a - b);
  }

  /**
   * Calculate matches and payout
   */
  static calculateMatches(selectedNumbers, winningNumbers, betAmount, spotCount) {
    const matches = selectedNumbers.filter(n => winningNumbers.includes(n)).length;
    const payout = this.getPaytable(spotCount, matches) * betAmount;

    return {
      selected: selectedNumbers,
      winning: winningNumbers,
      matches,
      payout,
      won: payout > 0
    };
  }

  /**
   * Keno paytable
   */
  static getPaytable(spots, matches) {
    const paytable = {
      1: { 0: 0, 1: 3 },
      2: { 0: 0, 1: 0, 2: 15 },
      3: { 0: 0, 1: 0, 2: 2, 3: 45 },
      4: { 0: 0, 1: 0, 2: 1, 3: 4, 4: 150 },
      5: { 0: 0, 1: 0, 2: 1, 3: 2, 4: 20, 5: 500 },
      6: { 0: 0, 1: 0, 2: 1, 3: 1, 4: 5, 5: 50, 6: 1500 },
      7: { 0: 0, 1: 0, 2: 0, 3: 1, 4: 2, 5: 10, 6: 100, 7: 3000 },
      8: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 1, 5: 5, 6: 25, 7: 200, 8: 5000 },
      9: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 1, 5: 2, 6: 10, 7: 50, 8: 500, 9: 10000 },
      10: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 1, 6: 5, 7: 20, 8: 100, 9: 1000, 10: 20000 }
    };

    return paytable[spots]?.[matches] || 0;
  }
}

module.exports = KenoEngine;
