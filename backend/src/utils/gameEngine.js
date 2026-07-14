const FairPlaySystem = require('./fairplay');
const OddsCalculator = require('./odds');
const crypto = require('crypto');

class GameEngine {
  /**
   * DICE GAME - Roll outcome
   * @param {number} random - Random value 0-1
   * @param {number} targetMultiplier - Target multiplier for win
   * @returns {object}
   */
  static diceBet(random, targetMultiplier) {
    const diceValue = Math.floor(random * 6) + 1;
    const result = diceValue >= targetMultiplier ? 'win' : 'loss';
    return {
      dice: diceValue,
      result,
      multiplier: targetMultiplier
    };
  }

  /**
   * CRASH GAME - Multiplier calculation
   * @param {number} random
   * @returns {object}
   */
  static crashGame(random) {
    const e = 2.71828;
    const multiplier = (Math.log(1 - random) / Math.log(1 - 0.99)) * e;
    return {
      multiplier: Math.max(1, Math.round(multiplier * 100) / 100),
      crashed: true
    };
  }

  /**
   * MINES GAME - Generate mine positions
   * @param {number} random
   * @param {number} mineCount - Number of mines
   * @returns {object}
   */
  static minesGame(random, mineCount = 3) {
    const grid = Array(25).fill(0);
    const minePositions = new Set();

    while (minePositions.size < mineCount) {
      const pos = Math.floor(random * 25);
      random = (random * 1103515245 + 12345) % 2147483648;
      minePositions.add(pos);
    }

    minePositions.forEach(pos => grid[pos] = 1);
    
    return {
      grid,
      mines: Array.from(minePositions)
    };
  }

  /**
   * COLOR PREDICTION - Predict color outcome
   * @param {number} random
   * @returns {object}
   */
  static colorPrediction(random) {
    const colors = ['red', 'black', 'green'];
    const probability = [18/37, 18/37, 1/37]; // Roulette probabilities
    
    let cumulative = 0;
    for (let i = 0; i < colors.length; i++) {
      cumulative += probability[i];
      if (random <= cumulative) {
        return {
          color: colors[i],
          odds: OddsCalculator.calculateOdds(probability[i])
        };
      }
    }
    return { color: colors[0], odds: OddsCalculator.calculateOdds(probability[0]) };
  }

  /**
   * ROULETTE - Spin outcome
   * @param {number} random
   * @returns {object}
   */
  static rouletteSpin(random) {
    const number = Math.floor(random * 37);
    const color = number === 0 ? 'green' : (number % 2 === 0 ? 'red' : 'black');
    const isEven = number % 2 === 0;
    
    return {
      number,
      color,
      isEven,
      isRed: color === 'red',
      isBlack: color === 'black'
    };
  }

  /**
   * PLINKO - Ball dropping through pegs
   * @param {number} random
   * @param {number} rows - Number of rows
   * @returns {object}
   */
  static plinkoBall(random, rows = 8) {
    let position = 0;
    let currentRandom = random;

    for (let i = 0; i < rows; i++) {
      currentRandom = (currentRandom * 1103515245 + 12345) % 2147483648;
      const normalized = currentRandom / 2147483648;
      if (normalized > 0.5) position++;
    }

    const multipliers = [1.5, 2, 2.5, 3, 3.5, 3, 2.5, 2, 1.5];
    return {
      position,
      multiplier: multipliers[position] || 1.5
    };
  }
}

module.exports = GameEngine;
