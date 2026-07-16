const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: DataTypes.STRING,
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'phone_verified'
    },
    kycVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'kyc_verified'
    },
    needsKycBeforeWithdrawal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'needs_kyc_before_withdrawal'
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'banned'),
      defaultValue: 'active'
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
    },
    totalBets: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_bets'
    },
    totalWinnings: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_winnings'
    }
  }, {
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  });

  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  return User;
};
