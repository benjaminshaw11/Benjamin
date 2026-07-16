const { DataTypes } = require('sequelize');
const { sequelize } = require('../models');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  walletId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('credit', 'debit'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
  },
  balanceAfter: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
  },
  meta: {
    type: DataTypes.JSONB,
    allowNull: true,
  }
}, {
  tableName: 'transactions',
  timestamps: true,
});

module.exports = Transaction;
