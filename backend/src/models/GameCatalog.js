const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GameCatalog = sequelize.define('GameCatalog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    provider: {
      type: DataTypes.STRING(128),
      allowNull: false,
      defaultValue: 'inhouse'
    },
    provider_game_id: {
      type: DataTypes.STRING(256),
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    engine: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    params: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    skin: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    bet_tier: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    house_edge: {
      type: DataTypes.DECIMAL(5,3),
      allowNull: true
    },
    thumbnail_url: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'game_catalog',
    timestamps: true
  });

  return GameCatalog;
};
