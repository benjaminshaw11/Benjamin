const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ManualDepositMatch = sequelize.define('ManualDepositMatch', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    manualDepositId: { type: DataTypes.UUID, field: 'manual_deposit_id' },
    bankTxnId: { type: DataTypes.TEXT, field: 'bank_txn_id' },
    bankAccount: { type: DataTypes.TEXT, field: 'bank_account' },
    bankIfsc: { type: DataTypes.TEXT, field: 'bank_ifsc' },
    amountCents: { type: DataTypes.BIGINT, field: 'amount_cents' },
    matchedAt: { type: DataTypes.DATE, field: 'matched_at' },
    matchedByAdminId: { type: DataTypes.UUID, field: 'matched_by_admin_id' },
    matchConfidence: { type: DataTypes.INTEGER, field: 'match_confidence', defaultValue: 0 },
    notes: { type: DataTypes.TEXT }
  }, {
    tableName: 'manual_deposit_matches',
    timestamps: false
  });

  ManualDepositMatch.associate = (models) => {
    ManualDepositMatch.belongsTo(models.ManualDeposit, { foreignKey: 'manualDepositId' });
  };

  return ManualDepositMatch;
};
