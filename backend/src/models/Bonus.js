const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Bonus = sequelize.define('Bonus', {
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
    bonusType: {
      type: DataTypes.ENUM('welcome', 'reload', 'cashback', 'referral', 'birthday', 'tournament', 'seasonal'),
      allowNull: false
    },
    depositAmount: DataTypes.DECIMAL(15, 2),
    bonusAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    wageringRequirement: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    remainingWagering: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'expired', 'cancelled'),
      defaultValue: 'active'
    },
    expiryDate: DataTypes.DATE,
    claimedDate: DataTypes.DATE,
    redeemDate: DataTypes.DATE
  });

  return Bonus;
};
