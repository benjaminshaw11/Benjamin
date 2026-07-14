const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bet = sequelize.define('Bet', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
      type: DataTypes.ENUM('dice', 'roulette', 'blackjack', 'crash', 'mines', 'plinko', 'color', 'sports', 'prediction'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    odds: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false
    },
    potential_payout: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'won', 'lost', 'cancelled'),
      defaultValue: 'pending'
    },
    payout: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    gameData: {
      type: DataTypes.JSON,
      allowNull: true
    },
    result: {
      type: DataTypes.JSON,
      allowNull: true
    },
    betData: {
      type: DataTypes.JSON,
      allowNull: true
    }
  });

  return Bet;
};
