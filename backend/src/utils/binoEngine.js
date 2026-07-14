class BinoEngine {
  /**
   * Generate bingo card
   * @returns {array} 5x5 grid
   */
  static generateCard() {
    const card = [];
    const ranges = {
      B: [1, 15],
      I: [16, 30],
      N: [31, 45],
      G: [46, 60],
      O: [61, 75]
    };

    const columns = ['B', 'I', 'N', 'G', 'O'];

    for (let col = 0; col < 5; col++) {
      const column = [];
      const [min, max] = ranges[columns[col]];
      const numbers = this.generateRandomNumbers(min, max, 5);
      
      for (let row = 0; row < 5; row++) {
        if (col === 2 && row === 2) {
          column.push(0); // FREE space in the middle
        } else {
          column.push(numbers[row]);
        }
      }
      card.push(column);
    }

    return card;
  }

  /**
   * Check for winners
   * @param {array} card
   * @param {array} calledNumbers
   * @returns {array} winning patterns
   */
  static checkWinner(card, calledNumbers) {
    const winners = [];
    const calledSet = new Set(calledNumbers);

    // Check rows
    for (let row = 0; row < 5; row++) {
      if (card.every((col, colIdx) => col[row] === 0 || calledSet.has(col[row]))) {
        winners.push({ type: 'row', index: row });
      }
    }

    // Check columns
    for (let col = 0; col < 5; col++) {
      if (card[col].every(num => num === 0 || calledSet.has(num))) {
        winners.push({ type: 'column', index: col });
      }
    }

    // Check diagonals
    if (this.checkDiagonal(card, calledNumbers, 'forward')) {
      winners.push({ type: 'diagonal', index: 'forward' });
    }
    if (this.checkDiagonal(card, calledNumbers, 'backward')) {
      winners.push({ type: 'diagonal', index: 'backward' });
    }

    // Check full card (Bingo)
    if (this.checkFullCard(card, calledNumbers)) {
      winners.push({ type: 'bingo' });
    }

    return winners;
  }

  static checkDiagonal(card, calledNumbers, direction) {
    const calledSet = new Set(calledNumbers);
    if (direction === 'forward') {
      return [0, 1, 2, 3, 4].every(i => card[i][i] === 0 || calledSet.has(card[i][i]));
    } else {
      return [0, 1, 2, 3, 4].every(i => card[4 - i][i] === 0 || calledSet.has(card[4 - i][i]));
    }
  }

  static checkFullCard(card, calledNumbers) {
    const calledSet = new Set(calledNumbers);
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 5; row++) {
        if (card[col][row] !== 0 && !calledSet.has(card[col][row])) {
          return false;
        }
      }
    }
    return true;
  }

  static generateRandomNumbers(min, max, count) {
    const numbers = [];
    const range = max - min + 1;
    for (let i = 0; i < count; i++) {
      const num = Math.floor(Math.random() * range) + min;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    return numbers;
  }
}

module.exports = BinoEngine;
