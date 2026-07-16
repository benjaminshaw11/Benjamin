const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OtpCode = sequelize.define('OtpCode', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    phone: { type: DataTypes.STRING, allowNull: false },
    codeHash: { type: DataTypes.STRING, allowNull: false, field: 'code_hash' },
    expiresAt: { type: DataTypes.DATE, field: 'expires_at' },
    attempts: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, {
    tableName: 'otp_codes',
    timestamps: true
  });

  return OtpCode;
};
