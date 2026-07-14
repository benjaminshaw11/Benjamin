const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VIPUser = sequelize.define('VIPUser', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    totalPoints: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },
    currentTier: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum', 'diamond'),
      defaultValue: 'bronze'
    },
    monthlySpent: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    monthlyBonus: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    totalCashback: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    lastTierUpgrade: DataTypes.DATE,
    nextTierDate: DataTypes.DATE
  });

  return VIPUser;
};
