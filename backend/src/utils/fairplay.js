const crypto = require('crypto');

class FairPlaySystem {
  /**
   * Generate provably fair random number
   * @param {string} serverSeed
   * @param {string} clientSeed
   * @param {number} nonce
   * @returns {number} Random value between 0 and 1
   */
  static generateRandom(serverSeed, clientSeed, nonce) {
    const combined = `${serverSeed}${clientSeed}${nonce}`;
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    const hexValue = hash.substring(0, 8);
    return parseInt(hexValue, 16) / 0xffffffff;
  }

  /**
   * Get server seed hash for verification
   * @param {string} serverSeed
   * @returns {string} SHA256 hash
   */
  static getServerSeedHash(serverSeed) {
    return crypto.createHash('sha256').update(serverSeed).digest('hex');
  }

  /**
   * Verify a game result
   * @param {object} gameResult
   * @returns {boolean}
   */
  static verifyResult(gameResult) {
    const { serverSeed, clientSeed, nonce, serverSeedHash, randomValue } = gameResult;
    
    // Verify server seed hash
    const calculatedHash = this.getServerSeedHash(serverSeed);
    if (calculatedHash !== serverSeedHash) {
      return false;
    }

    // Verify random value
    const calculatedRandom = this.generateRandom(serverSeed, clientSeed, nonce);
    return Math.abs(calculatedRandom - randomValue) < 0.00001;
  }
}

module.exports = FairPlaySystem;
