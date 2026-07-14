class BlackjackEngine {
  static CARD_VALUES = {
    'A': [1, 11],
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
    '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 10, 'Q': 10, 'K': 10
  };

  static SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
  static RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  /**
   * Generate deck
   * @returns {array}
   */
  static generateDeck() {
    const deck = [];
    for (let suit of this.SUITS) {
      for (let rank of this.RANKS) {
        deck.push({ suit, rank });
      }
    }
    return deck;
  }

  /**
   * Calculate hand value
   * @param {array} cards
   * @returns {object} {value, isSoft}
   */
  static calculateHandValue(cards) {
    let value = 0;
    let aces = 0;

    for (let card of cards) {
      const cardValue = this.CARD_VALUES[card.rank];
      if (Array.isArray(cardValue)) {
        aces++;
        value += 11;
      } else {
        value += cardValue;
      }
    }

    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }

    return {
      value,
      isSoft: aces > 0 && value <= 11
    };
  }

  /**
   * Determine winner
   * @param {object} playerHand
   * @param {object} dealerHand
   * @returns {string} 'win', 'lose', 'push', 'blackjack'
   */
  static determineWinner(playerHand, dealerHand) {
    const player = this.calculateHandValue(playerHand);
    const dealer = this.calculateHandValue(dealerHand);

    // Check for blackjack
    if (playerHand.length === 2 && player.value === 21) {
      if (dealerHand.length === 2 && dealer.value === 21) {
        return 'push';
      }
      return 'blackjack';
    }

    // Check bust
    if (player.value > 21) return 'lose';
    if (dealer.value > 21) return 'win';

    // Compare values
    if (player.value > dealer.value) return 'win';
    if (player.value < dealer.value) return 'lose';
    return 'push';
  }
}

module.exports = BlackjackEngine;
