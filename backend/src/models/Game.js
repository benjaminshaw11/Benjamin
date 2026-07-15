/**
 * Game Model
 * Stores game sessions with RNG seeds
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Game = sequelize.define('Game', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    serverSeed: {
      type: DataTypes.STRING(512),
      allowNull: false,
      comment: 'Server-generated random seed (kept secret until game ends)'
    },
    serverSeedHash: {
      type: DataTypes.STRING(256),
      allowNull: false,
      comment: 'SHA256 hash of server seed (published before game)'
    },
    clientSeed: {
      type: DataTypes.STRING(256),
      allowNull: true,
      comment: 'Player-provided seed for provably fair verification'
    },
    nonce: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Increments with each bet to ensure unique results'
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'completed', 'cancelled'),
      defaultValue: 'pending',
      comment: 'Game session status'
    },
    totalBets: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total number of bets placed'
    },
    totalWinnings: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: 'Net profit/loss for player'
    },
    totalBetAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      comment: 'Total amount wagered'
    },
    gameData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional game-specific data (mines positions, etc.)'
    },
    nextServerSeedHash: {
      type: DataTypes.STRING(256),
      allowNull: true,
      comment: 'Hash of next session seed (for continuous play)'
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'Games',
    indexes: [
      { fields: ['userId'] },
      { fields: ['status'] },
      { fields: ['createdAt'] }
    ]
  });

  return Game;
};
