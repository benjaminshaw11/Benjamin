const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PredictionBet = sequelize.define('PredictionBet', {
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
    marketId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'PredictionMarkets',
        key: 'id'
      }
    },
    prediction: {
      type: DataTypes.ENUM('yes', 'no'),
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
      type: DataTypes.DECIMAL(15, 2)
    },
    status: {
      type: DataTypes.ENUM('open', 'won', 'lost', 'cancelled'),
      defaultValue: 'open'
    },
    payout: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    }
  });

  return PredictionBet;
};
