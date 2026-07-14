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
    kycVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'banned'),
      defaultValue: 'active'
    },
    totalDeposits: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    totalWithdrawals: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    totalBets: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    totalWinnings: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
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
