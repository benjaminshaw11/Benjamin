const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Referral = sequelize.define('Referral', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    affiliateId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Affiliates',
        key: 'id'
      }
    },
    referredUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    referralCode: DataTypes.STRING,
    totalDeposits: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    totalBets: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    netProfit: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    totalCommission: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    joinedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  return Referral;
};
