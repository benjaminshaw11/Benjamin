const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LedgerEntry = sequelize.define('LedgerEntry', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    entryType: { type: DataTypes.STRING, allowNull: false, field: 'entry_type' }, // credit/debit
    userId: { type: DataTypes.UUID, field: 'user_id' },
    amountCents: { type: DataTypes.BIGINT, allowNull: false, field: 'amount_cents' },
    currency: { type: DataTypes.STRING, defaultValue: 'INR' },
    relatedDepositId: { type: DataTypes.UUID, field: 'related_deposit_id' },
    balanceBeforeCents: { type: DataTypes.BIGINT, field: 'balance_before_cents' },
    balanceAfterCents: { type: DataTypes.BIGINT, field: 'balance_after_cents' },
    metadata: { type: DataTypes.JSONB }
  }, {
    tableName: 'ledger_entries',
    timestamps: true
  });

  LedgerEntry.associate = (models) => {
    LedgerEntry.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return LedgerEntry;
};
