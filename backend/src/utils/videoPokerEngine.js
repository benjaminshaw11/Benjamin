class VideoPokerEngine {
  static HAND_RANKINGS = {
    'royal-flush': { rank: 10, multiplier: 800 },
    'straight-flush': { rank: 9, multiplier: 50 },
    'four-of-a-kind': { rank: 8, multiplier: 25 },
    'full-house': { rank: 7, multiplier: 9 },
    'flush': { rank: 6, multiplier: 6 },
    'straight': { rank: 5, multiplier: 4 },
    'three-of-a-kind': { rank: 4, multiplier: 3 },
    'two-pair': { rank: 3, multiplier: 2 },
    'one-pair': { rank: 2, multiplier: 1 },
    'high-card': { rank: 1, multiplier: 0 }
  };

  static CARD_VALUES = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11,
    '10': 10, '9': 9, '8': 8, '7': 7, '6': 6,
    '5': 5, '4': 4, '3': 3, '2': 2
  };

  static SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
  static RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

  /**
   * Generate deck
   */
  static generateDeck() {
    const deck = [];
    for (let suit of this.SUITS) {
      for (let rank of this.RANKS) {
        deck.push({ suit, rank });
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  }

  /**
   * Evaluate hand
   */
  static evaluateHand(cards) {
    const ranks = cards.map(c => this.CARD_VALUES[c.rank]).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);
    const rankCounts = this.getCountMap(ranks);
    const suitCounts = this.getCountMap(suits);

    if (this.isRoyalFlush(ranks, suitCounts)) return 'royal-flush';
    if (this.isStraightFlush(ranks, suitCounts)) return 'straight-flush';
    if (this.isFourOfAKind(rankCounts)) return 'four-of-a-kind';
    if (this.isFullHouse(rankCounts)) return 'full-house';
    if (this.isFlush(suitCounts)) return 'flush';
    if (this.isStraight(ranks)) return 'straight';
    if (this.isThreeOfAKind(rankCounts)) return 'three-of-a-kind';
    if (this.isTwoPair(rankCounts)) return 'two-pair';
    if (this.isOnePair(rankCounts)) return 'one-pair';
    return 'high-card';
  }

  static getCountMap(arr) {
    const map = {};
    arr.forEach(val => map[val] = (map[val] || 0) + 1);
    return map;
  }

  static isRoyalFlush(ranks, suitCounts) {
    return this.isStraightFlush(ranks, suitCounts) && ranks[0] === 14;
  }

  static isStraightFlush(ranks, suitCounts) {
    return this.isStraight(ranks) && Math.max(...Object.values(suitCounts)) === 5;
  }

  static isFourOfAKind(rankCounts) {
    return Math.max(...Object.values(rankCounts)) === 4;
  }

  static isFullHouse(rankCounts) {
    const counts = Object.values(rankCounts);
    return counts.includes(3) && counts.includes(2);
  }

  static isFlush(suitCounts) {
    return Math.max(...Object.values(suitCounts)) === 5;
  }

  static isStraight(ranks) {
    for (let i = 0; i < 4; i++) {
      if (ranks[i] - ranks[i + 1] !== 1) return false;
    }
    return true;
  }

  static isThreeOfAKind(rankCounts) {
    return Math.max(...Object.values(rankCounts)) === 3;
  }

  static isTwoPair(rankCounts) {
    const counts = Object.values(rankCounts);
    return counts.filter(c => c === 2).length === 2;
  }

  static isOnePair(rankCounts) {
    return Math.max(...Object.values(rankCounts)) === 2;
  }

  /**
   * Calculate payout based on hand
   */
  static calculatePayout(betAmount, handType) {
    const handInfo = this.HAND_RANKINGS[handType];
    return betAmount * handInfo.multiplier;
  }
}

module.exports = VideoPokerEngine;
