// backend/src/models/CasinoGame.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CasinoGame = sequelize.define('CasinoGame', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: DataTypes.STRING,
    subcategory: DataTypes.STRING,
    description: DataTypes.TEXT,
    thumbnailUrl: {
      type: DataTypes.TEXT,
      field: 'thumbnail_url'
    },
    minBet: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'min_bet'
    },
    maxBet: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: 'max_bet'
    },
    rtp: {
      type: DataTypes.DECIMAL(5, 2)
    },
    houseEdge: {
      type: DataTypes.DECIMAL(5, 2),
      field: 'house_edge'
    },
    volatility: DataTypes.STRING,
    provider: DataTypes.STRING,
    popularity: DataTypes.INTEGER,
    isLive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_live'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    }
  }, {
    tableName: 'casino_games',
    timestamps: true
  });

  CasinoGame.associate = (models) => {
    CasinoGame.hasMany(models.Bet, { foreignKey: 'gameId', as: 'bets' });
  };

  return CasinoGame;
};
