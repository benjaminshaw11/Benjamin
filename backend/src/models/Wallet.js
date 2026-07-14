const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Wallet = sequelize.define('Wallet', {
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
    balance: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    currency: {
      type: DataTypes.ENUM('INR', 'USD', 'EUR'),
      defaultValue: 'INR'
    },
    locked: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    }
  });

  return Wallet;
};
