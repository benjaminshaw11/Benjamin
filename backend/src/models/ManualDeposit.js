const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ManualDeposit = sequelize.define('ManualDeposit', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    amountCents: { type: DataTypes.BIGINT, allowNull: false, field: 'amount_cents' },
    currency: { type: DataTypes.STRING, defaultValue: 'INR' },
    remitterName: { type: DataTypes.TEXT, field: 'remitter_name' },
    remitterAccount: { type: DataTypes.TEXT, field: 'remitter_account' },
    remitterVpa: { type: DataTypes.TEXT, field: 'remitter_vpa' },
    providedReference: { type: DataTypes.TEXT, field: 'provided_reference' },
    evidencePath: { type: DataTypes.TEXT, field: 'evidence_path' },
    status: { type: DataTypes.STRING, defaultValue: 'pending' }
  }, {
    tableName: 'manual_deposits',
    timestamps: true
  });

  ManualDeposit.associate = (models) => {
    ManualDeposit.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return ManualDeposit;
};
