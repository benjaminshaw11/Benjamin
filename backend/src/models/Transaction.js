// backend/src/models/Transaction.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id'
    },
    walletId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'wallet_id'
    },
    transactionType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'transaction_type'
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    balanceBefore: {
      type: DataTypes.DECIMAL(15, 2),
      field: 'balance_before'
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(15, 2),
      field: 'balance_after'
    },
    paymentMethod: {
      type: DataTypes.STRING,
      field: 'payment_method'
    },
    referenceId: {
      type: DataTypes.STRING,
      field: 'reference_id'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    description: DataTypes.TEXT
  }, {
    tableName: 'transactions',
    timestamps: true
  });

  Transaction.associate = (models) => {
    Transaction.belongsTo(models.User, { foreignKey: 'userId' });
    Transaction.belongsTo(models.Wallet, { foreignKey: 'walletId' });
  };

  return Transaction;
};