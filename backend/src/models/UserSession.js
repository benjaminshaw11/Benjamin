// backend/src/models/UserSession.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserSession = sequelize.define('UserSession', {
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
    sessionToken: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      field: 'session_token'
    },
    refreshToken: {
      type: DataTypes.STRING(255),
      unique: true,
      field: 'refresh_token'
    },
    deviceType: {
      type: DataTypes.STRING,
      field: 'device_type'
    },
    deviceOs: {
      type: DataTypes.STRING,
      field: 'device_os'
    },
    ipAddress: {
      type: DataTypes.STRING,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      field: 'user_agent'
    },
    loginAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'login_at'
    },
    lastActivity: {
      type: DataTypes.DATE,
      field: 'last_activity'
    },
    logoutAt: {
      type: DataTypes.DATE,
      field: 'logout_at'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'user_sessions',
    timestamps: false
  });

  UserSession.prototype.isValid = function() {
    return this.isActive && !this.logoutAt;
  };

  UserSession.associate = (models) => {
    UserSession.belongsTo(models.User, { foreignKey: 'userId' });
  };

  return UserSession;
};
