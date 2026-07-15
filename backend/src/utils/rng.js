/**
 * Random Number Generator (RNG) Module
 * Uses Mersenne Twister PRNG for casino games
 * Implements Provably Fair System with Server & Client Seeds
 */

const crypto = require('crypto');

// Mersenne Twister implementation
class MersenneTwister {
  constructor(seed = Date.now()) {
    this.N = 624;
    this.M = 397;
    this.MATRIX_A = 0x9908b0df;
    this.UPPER_MASK = 0x80000000;
    this.LOWER_MASK = 0x7fffffff;

    this.mt = new Array(this.N);
    this.mti = this.N + 1;
    this.init_genrand(seed);
  }

  init_genrand(s) {
    this.mt[0] = s >>> 0;
    for (this.mti = 1; this.mti < this.N; this.mti++) {
      const s = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
      this.mt[this.mti] = (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) + (s & 0xffff) * 1812433253) + this.mti;
      this.mt[this.mti] >>>= 0;
    }
  }

  genrand_int32() {
    let y;
    const mag01 = [0x0, this.MATRIX_A];

    if (this.mti >= this.N) {
      if (this.mti > this.N) return Math.floor(Math.random() * 0xffffffff);

      let kk;
      for (kk = 0; kk < this.N - this.M; kk++) {
        y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
        this.mt[kk] = this.mt[kk + this.M] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      for (; kk < this.N - 1; kk++) {
        y = (this.mt[kk] & this.UPPER_MASK) | (this.mt[kk + 1] & this.LOWER_MASK);
        this.mt[kk] = this.mt[kk + (this.M - this.N)] ^ (y >>> 1) ^ mag01[y & 0x1];
      }
      y = (this.mt[this.N - 1] & this.UPPER_MASK) | (this.mt[0] & this.LOWER_MASK);
      this.mt[this.N - 1] = this.mt[this.M - 1] ^ (y >>> 1) ^ mag01[y & 0x1];
      this.mti = 0;
    }

    y = this.mt[this.mti++];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;

    return y >>> 0;
  }

  random() {
    return (this.genrand_int32() >>> 5) * (1.0 / 67108864.0);
  }

  randomInt(min, max) {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  randomArray(length) {
    const arr = [];
    for (let i = 0; i < length; i++) {
      arr.push(this.random());
    }
    return arr;
  }
}

/**
 * Provably Fair RNG System
 * Combines server seed, client seed, and nonce for transparent randomness
 */
class ProvablyFairRNG {
  constructor() {
    this.serverSeed = this.generateServerSeed();
  }

  /**
   * Generate a random server seed
   * @returns {string} Hex encoded server seed
   */
  generateServerSeed() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate server seed hash (to be revealed after game)
   * @param {string} seed - Server seed
   * @returns {string} SHA256 hash of server seed
   */
  generateServerSeedHash(seed) {
    return crypto.createHash('sha256').update(seed).digest('hex');
  }

  /**
   * Generate next round's server seed hash
   * @returns {string} Hex encoded next server seed hash
   */
  generateNextServerSeedHash() {
    const nextSeed = this.generateServerSeed();
    this.serverSeed = nextSeed;
    return this.generateServerSeedHash(nextSeed);
  }

  /**
   * Combine server seed and client seed with nonce
   * @param {string} serverSeed - Server seed
   * @param {string} clientSeed - Client seed
   * @param {number} nonce - Incrementing nonce per bet
   * @returns {string} Combined seed hash
   */
  combinedSeed(serverSeed, clientSeed, nonce) {
    const combined = `${serverSeed}-${clientSeed}-${nonce}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Convert hex to integer for RNG seeding
   * @param {string} hexString - Hex string
   * @returns {number} Integer seed
   */
  hexToSeed(hexString) {
    return parseInt(hexString.substring(0, 8), 16);
  }

  /**
   * Verify game result after completion
   * @param {string} serverSeed - Original server seed
   * @param {string} serverSeedHash - Published hash before game
   * @returns {boolean} True if seed matches hash
   */
  verifyServerSeed(serverSeed, serverSeedHash) {
    const hash = this.generateServerSeedHash(serverSeed);
    return hash === serverSeedHash;
  }

  /**
   * Generate random value with provably fair system
   * @param {string} serverSeed - Server seed
   * @param {string} clientSeed - Client seed
   * @param {number} nonce - Nonce
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random value between min and max
   */
  generateFairRandom(serverSeed, clientSeed, nonce, min = 0, max = 1) {
    const seedHash = this.combinedSeed(serverSeed, clientSeed, nonce);
    const seed = this.hexToSeed(seedHash);
    const mt = new MersenneTwister(seed);
    return mt.randomInt(min, max);
  }
}

/**
 * Game RNG Helper
 * Provides simplified RNG functions for different game types
 */
class GameRNG {
  static rng = new ProvablyFairRNG();

  /**
   * Dice Roll (1-6)
   * @param {Object} seeds - {serverSeed, clientSeed, nonce}
   * @returns {number} Dice value 1-6
   */
  static diceRoll(seeds) {
    return GameRNG.rng.generateFairRandom(
      seeds.serverSeed,
      seeds.clientSeed,
      seeds.nonce,
      1,
      6
    );
  }

  /**
   * Coin Flip (0 = Heads, 1 = Tails)
   * @param {Object} seeds - {serverSeed, clientSeed, nonce}
   * @returns {number} 0 or 1
   */
  static coinFlip(seeds) {
    return GameRNG.rng.generateFairRandom(
      seeds.serverSeed,
      seeds.clientSeed,
      seeds.nonce,
      0,
      1
    );
  }

  /**
   * Roulette Spin (0-36 for European, 0-37 for American)
   * @param {Object} seeds - {serverSeed, clientSeed, nonce}
   * @param {number} wheelSize - 37 for European, 38 for American
   * @returns {number} Roulette number
   */
  static rouletteSpin(seeds, wheelSize = 37) {
    return GameRNG.rng.generateFairRandom(
      seeds.serverSeed,
      seeds.clientSeed,
      seeds.nonce,
      0,
      wheelSize - 1
    );
  }

  /**
   * Slot Machine Reels
   * @param {Object} seeds - {serverSeed, clientSeed, nonce}
   * @param {number} reels - Number of reels (default 5)
   * @param {number} symbols - Number of symbols per reel (default 10)
   * @returns {Array} Array of reel positions
   */
  static slotReels(seeds, reels = 5, symbols = 10) {
    const results = [];
    for (let i = 0; i < reels; i++) {
      results.push(
        GameRNG.rng.generateFairRandom(
          seeds.serverSeed,
          seeds.clientSeed,
          seeds.nonce + i,
          0,
          symbols - 1
        )
      );
    }
    return results;
  }

  /**
   * Card Deck Shuffle
   * @param {Object} seeds - {serverSeed, clientSeed, nonce}
   * @param {number} deckSize - 52 for standard deck
   * @returns {Array} Shuffled array of card indices
   */
  static shuffleDeck(seeds, deckSize = 52) {
    const seed = GameRNG.rng.hexToSeed(
      GameRNG.rng.combinedSeed(seeds.serverSeed, seeds.clientSeed, seeds.nonce)
    );
    const mt = new MersenneTwister(seed);
    const deck = Array.from({ length: deckSize }, (_, i) => i);

    for (let i = deckSize - 1; i > 0; i--) {
      const j = mt.randomInt(0, i);
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  /**
   * Crash Game Multiplier
   * @param {Object} seeds - {serverSeed, clientSeed, nonce}
   * @returns {number} Crash multiplier (1.01 - 999.99)
   */
  static crashMultiplier(seeds) {
    const randomValue = GameRNG.rng.generateFairRandom(
      seeds.serverSeed,
      seeds.clientSeed,
      seeds.nonce,
      1,
      99999
    );
    return (randomValue / 100).toFixed(2);
  }

  /**
   * Mines Game - Generate mine positions
   * @param {Object} seeds - {serverSeed, clientSeed, nonce}
   * @param {number} totalSquares - Total squares (default 25)
   * @param {number} mineCount - Number of mines (default 5)
   * @returns {Array} Array of mine positions
   */
  static generateMines(seeds, totalSquares = 25, mineCount = 5) {
    const positions = new Set();
    let count = 0;
    while (count < mineCount) {
      const pos = GameRNG.rng.generateFairRandom(
        seeds.serverSeed,
        seeds.clientSeed,
        seeds.nonce + count,
        0,
        totalSquares - 1
      );
      if (!positions.has(pos)) {
        positions.add(pos);
        count++;
      }
    }
    return Array.from(positions);
  }

  /**
   * Color Prediction (Red, Green, Blue, Yellow)
   * @param {Object} seeds - {serverSeed, clientSeed, nonce}
   * @returns {string} Color name
   */
  static colorPrediction(seeds) {
    const colors = ['red', 'green', 'blue', 'yellow'];
    const index = GameRNG.rng.generateFairRandom(
      seeds.serverSeed,
      seeds.clientSeed,
      seeds.nonce,
      0,
      colors.length - 1
    );
    return colors[index];
  }

  /**
   * Random Float between 0-1
   * @param {Object} seeds - {serverSeed, clientSeed, nonce}
   * @returns {number} Float between 0 and 1
   */
  static randomFloat(seeds) {
    const randomInt = GameRNG.rng.generateFairRandom(
      seeds.serverSeed,
      seeds.clientSeed,
      seeds.nonce,
      1,
      1000000
    );
    return randomInt / 1000000;
  }

  /**
   * Apply House Edge (add fairness)
   * @param {number} houseEdge - House edge percentage (e.g., 2.7 for roulette)
   * @param {number} playerBet - Original bet amount
   * @returns {number} Effective payout after house edge
   */
  static applyHouseEdge(houseEdge, playerBet) {
    return playerBet * (1 - houseEdge / 100);
  }
}

module.exports = {
  MersenneTwister,
  ProvablyFairRNG,
  GameRNG,
};
