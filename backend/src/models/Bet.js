/**
 * Bet Model
 * Stores all individual bets and game results
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bet = sequelize.define('Bet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    gameId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Games',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    gameType: {
      type: DataTypes.ENUM(
        'dice',
        'roulette_european',
        'roulette_american',
        'blackjack',
        'baccarat',
        'crash',
        'mines',
        'color_prediction',
        'slots',
        'poker',
        'keno',
        'bingo'
      ),
      allowNull: false,
      comment: 'Type of game'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Amount wagered'
    },
    prediction: {
      type: DataTypes.STRING(256),
      allowNull: true,
      comment: 'Player prediction or selection'
    },
    result: {
      type: DataTypes.STRING(256),
      allowNull: false,
      comment: 'Game result'
    },
    isWin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      comment: 'Whether player won'
    },
    payout: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Amount paid to player'
    },
    profit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      comment: 'Net profit (payout - amount)'
    },
    nonce: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Nonce used to generate this result (for fairness verification)'
    },
    houseEdge: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'House edge percentage applied'
    },
    rtp: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Return to Player percentage'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional bet metadata'
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether fairness has been verified'
    }
  }, {
    timestamps: true,
    tableName: 'Bets',
    indexes: [
      { fields: ['gameId'] },
      { fields: ['userId'] },
      { fields: ['gameType'] },
      { fields: ['createdAt'] },
      { fields: ['nonce'] }
    ]
  });

  return Bet;
};