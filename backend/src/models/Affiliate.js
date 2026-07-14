const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Affiliate = sequelize.define('Affiliate', {
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
    referralCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    totalReferrals: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    activeReferrals: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalCommission: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    pendingCommission: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    withdrawnCommission: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    currentTier: {
      type: DataTypes.ENUM('tier1', 'tier2', 'tier3', 'tier4', 'tier5'),
      defaultValue: 'tier1'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    }
  });

  return Affiliate;
};
