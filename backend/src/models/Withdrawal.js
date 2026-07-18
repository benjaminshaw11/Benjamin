const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Withdrawal = sequelize.define('Withdrawal', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    transactionId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    accountDetails: {
      type: DataTypes.JSONB,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'declined', 'paid', 'failed'),
      defaultValue: 'pending'
    },
    provider_payout_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'withdrawals',
    timestamps: true
  });

  Withdrawal.associate = (models) => {
    Withdrawal.belongsTo(models.User, { foreignKey: 'userId' });
    Withdrawal.belongsTo(models.Transaction, { foreignKey: 'transactionId' });
  };

  return Withdrawal;
};
