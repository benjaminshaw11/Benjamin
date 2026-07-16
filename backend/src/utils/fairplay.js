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

  /**
   * Apply rig mode to a generated random value.
   * Non-production only. Controlled by RIG_MODE env var.
   * Supported RIG_MODE values:
   *  - force_house_win
   *  - force_player_win
   *  - override:<0-1> (explicit random value between 0 and 1)
   *  - bias:<decimal> (e.g. bias:0.1 biases towards house when positive)
   *
   * @param {number} normalRandom - the original random from generateRandom
   * @param {string} gameType - game type (e.g., 'dice')
   * @param {object} betData - game specific bet data (target, payout, etc.)
   */
  static applyRig(normalRandom, gameType, betData = {}) {
    try {
      const rig = (process.env.RIG_MODE || '').toString().trim();
      const env = (process.env.NODE_ENV || 'development').toString();

      if (!rig) return { usedRandom: normalRandom, rigged: null };
      if (env === 'production') {
        // Never enable rig mode in production; ignore and log
        console.warn('RIG_MODE present but ignored in production');
        return { usedRandom: normalRandom, rigged: null };
      }

      // Parse override value
      if (rig.startsWith('override:')) {
        const val = parseFloat(rig.split(':')[1]);
        if (!Number.isFinite(val) || val < 0 || val >= 1) return { usedRandom: normalRandom, rigged: null };
        return { usedRandom: val, rigged: { mode: 'override', value: val } };
      }

      if (rig.startsWith('bias:')) {
        const bias = parseFloat(rig.split(':')[1]) || 0;
        // bias > 0 biases towards house (makes low rolls more likely for player-loss games)
        // simple power function to skew distribution
        const factor = 1 + Math.abs(bias);
        const used = bias > 0 ? Math.pow(normalRandom, factor) : 1 - Math.pow(1 - normalRandom, factor);
        return { usedRandom: used, rigged: { mode: 'bias', bias } };
      }

      if (rig === 'force_house_win' || rig === 'force_player_win') {
        const forcePlayerWin = rig === 'force_player_win';

        // Implement game-specific rigging where possible
        switch ((gameType || '').toLowerCase()) {
          case 'dice': {
            // diceValue = floor(random * 6) + 1 -> value 1..6
            // We expect betData.target or betData.targetMultiplier to be the threshold (1..6)
            const target = parseFloat(betData?.target ?? betData?.targetMultiplier);
            let desired = null;
            if (Number.isFinite(target)) {
              const t = Math.max(1, Math.min(6, Math.round(target)));
              if (forcePlayerWin) {
                // want diceValue >= t -> choose value = t .. 6; pick mid
                const pick = Math.min(6, t);
                desired = (pick - 0.5) / 6;
              } else {
                // want diceValue < t -> choose value = 1 .. t-1
                const pick = Math.max(1, Math.min(6, t - 1));
                desired = (pick - 0.5) / 6;
              }
              if (desired !== null) return { usedRandom: desired, rigged: { mode: rig, target: t } };
            }
            break;
          }
          case 'crash': {
            // crash multiplier increases as random decreases (roughly). To force house win, push random higher.
            if (forcePlayerWin) {
              // make random very small so multiplier large
              return { usedRandom: Math.max(0, normalRandom * 0.01), rigged: { mode: rig } };
            } else {
              // increase random towards 0.99 to force quick crash
              return { usedRandom: Math.min(0.999999, normalRandom + 0.5), rigged: { mode: rig } };
            }
          }
          case 'plinko':
          case 'mines':
          case 'roulette':
          case 'color_prediction':
          default: {
            // Generic fallback: nudge random towards loss or win depending on mode
            if (forcePlayerWin) {
              const used = Math.max(0, normalRandom * 0.1); // bias low
              return { usedRandom: used, rigged: { mode: rig } };
            } else {
              const used = Math.min(0.999999, normalRandom + 0.4); // bias high
              return { usedRandom: used, rigged: { mode: rig } };
            }
          }
        }
      }

      // Unknown rig mode -> ignore
      return { usedRandom: normalRandom, rigged: null };
    } catch (e) {
      console.warn('applyRig error', e);
      return { usedRandom: normalRandom, rigged: null };
    }
  }
}

module.exports = FairPlaySystem;
