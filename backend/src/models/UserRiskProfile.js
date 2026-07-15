// backend/src/models/UserRiskProfile.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserRiskProfile = sequelize.define('UserRiskProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id'
    },
    pgRiskLevel: {
      type: DataTypes.STRING,
      field: 'pg_risk_level'
    },
    pgRiskScore: {
      type: DataTypes.INTEGER,
      field: 'pg_risk_score'
    },
    pgLastAssessment: {
      type: DataTypes.DATE,
      field: 'pg_last_assessment'
    },
    pgAlerts: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      field: 'pg_alerts'
    },
    avgDailyBets: {
      type: DataTypes.DECIMAL(10, 2),
      field: 'avg_daily_bets'
    },
    avgBetSize: {
      type: DataTypes.DECIMAL(15, 2),
      field: 'avg_bet_size'
    },
    winRate: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'win_rate'
    },
    lossStreak: {
      type: DataTypes.INTEGER,
      field: 'loss_streak'
    },
    totalDeposits: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_deposits'
    },
    totalWithdrawals: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_withdrawals'
    }
  }, {
    tableName: 'user_risk_profiles',
    timestamps: true
  });

  UserRiskProfile.associate = (models) => {
    UserRiskProfile.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return UserRiskProfile;
};
