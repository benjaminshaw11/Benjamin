// backend/src/models/Incident.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Incident = sequelize.define('Incident', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    incidentType: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'incident_type'
    },
    severity: DataTypes.STRING,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    details: DataTypes.JSONB,
    affectedUsers: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      field: 'affected_users'
    },
    affectedMarkets: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      field: 'affected_markets'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'open'
    },
    resolutionNotes: {
      type: DataTypes.TEXT,
      field: 'resolution_notes'
    },
    resolvedAt: {
      type: DataTypes.DATE,
      field: 'resolved_at'
    }
  }, {
    tableName: 'incidents',
    timestamps: true
  });

  return Incident;
};
