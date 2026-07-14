const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PredictionMarket = sequelize.define('PredictionMarket', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: DataTypes.TEXT,
    category: {
      type: DataTypes.ENUM('sports', 'crypto', 'politics', 'entertainment', 'weather', 'other'),
      defaultValue: 'other'
    },
    resolutionDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('open', 'closed', 'resolved'),
      defaultValue: 'open'
    },
    yesPool: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    noPool: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    yesOdds: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 1.5
    },
    noOdds: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 1.5
    },
    resolution: {
      type: DataTypes.ENUM('yes', 'no', 'cancelled'),
      allowNull: true
    },
    resolvedAt: DataTypes.DATE,
    totalVolume: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    }
  });

  return PredictionMarket;
};
