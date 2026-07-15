// backend/src/models/Prediction.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Prediction = sequelize.define('Prediction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    description: DataTypes.TEXT,
    category: DataTypes.STRING,
    subcategory: DataTypes.STRING,
    resolutionCriteria: {
      type: DataTypes.TEXT,
      field: 'resolution_criteria'
    },
    resolutionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'resolution_date'
    },
    closingDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'closing_date'
    },
    initialProbability: {
      type: DataTypes.JSONB,
      field: 'initial_probability'
    },
    currentProbability: {
      type: DataTypes.JSONB,
      field: 'current_probability'
    },
    lastProbabilityUpdate: {
      type: DataTypes.DATE,
      field: 'last_probability_update'
    },
    updateSource: {
      type: DataTypes.STRING,
      field: 'update_source'
    },
    outcomes: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    result: DataTypes.STRING,
    resolvedAt: {
      type: DataTypes.DATE,
      field: 'resolved_at'
    },
    volume: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    totalBets: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_bets'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    }
  }, {
    tableName: 'predictions',
    timestamps: true
  });

  Prediction.associate = (models) => {
    Prediction.hasMany(models.Bet, { foreignKey: 'predictionId', as: 'bets' });
  };

  return Prediction;
};
