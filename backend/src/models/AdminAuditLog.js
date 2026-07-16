const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminAuditLog = sequelize.define('AdminAuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    adminId: { type: DataTypes.UUID, allowNull: false, field: 'admin_id' },
    action: { type: DataTypes.STRING, allowNull: false },
    targetType: { type: DataTypes.STRING, field: 'target_type' },
    targetId: { type: DataTypes.UUID, field: 'target_id' },
    reason: { type: DataTypes.TEXT },
    idempotencyKey: { type: DataTypes.STRING, field: 'idempotency_key' },
    metadata: { type: DataTypes.JSONB }
  }, {
    tableName: 'admin_audit_logs',
    timestamps: true
  });

  return AdminAuditLog;
};
