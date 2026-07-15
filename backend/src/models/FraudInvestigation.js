// backend/src/models/FraudInvestigation.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FraudInvestigation = sequelize.define('FraudInvestigation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      field: 'user_id'
    },
    betId: {
      type: DataTypes.UUID,
      field: 'bet_id'
    },
    investigationType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'investigation_type'
    },
    severity: DataTypes.STRING,
    fraudScore: {
      type: DataTypes.INTEGER,
      field: 'fraud_score'
    },
    signals: DataTypes.JSONB,
    status: {
      type: DataTypes.STRING,
      defaultValue: 'open'
    },
    reviewNotes: {
      type: DataTypes.TEXT,
      field: 'review_notes'
    }
  }, {
    tableName: 'fraud_investigations',
    timestamps: true
  });

  FraudInvestigation.associate = (models) => {
    FraudInvestigation.belongsTo(models.User, { foreignKey: 'userId' });
    FraudInvestigation.belongsTo(models.Bet, { foreignKey: 'betId' });
  };

  return FraudInvestigation;
};
