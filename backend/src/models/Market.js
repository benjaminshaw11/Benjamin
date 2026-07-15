// backend/src/models/Market.js
// Market Model Definition

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Market = sequelize.define('Market', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sport: {
      type: DataTypes.STRING,
      allowNull: false
    },
    league: DataTypes.STRING,
    eventName: {
      type: DataTypes.STRING,
      field: 'event_name'
    },
    eventId: {
      type: DataTypes.STRING,
      unique: true,
      field: 'event_id'
    },
    homeTeam: {
      type: DataTypes.STRING,
      field: 'home_team'
    },
    awayTeam: {
      type: DataTypes.STRING,
      field: 'away_team'
    },
    eventDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'event_date'
    },
    closingDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'closing_date'
    },
    initialOdds: {
      type: DataTypes.JSONB,
      field: 'initial_odds'
    },
    currentOdds: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: 'current_odds'
    },
    lastOddsUpdate: {
      type: DataTypes.DATE,
      field: 'last_odds_update'
    },
    liveScore: {
      type: DataTypes.JSONB,
      field: 'live_score'
    },
    lastScoreUpdate: {
      type: DataTypes.DATE,
      field: 'last_score_update'
    },
    liveStatus: {
      type: DataTypes.STRING,
      field: 'live_status'
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending'
    },
    result: DataTypes.JSONB,
    resolvedAt: {
      type: DataTypes.DATE,
      field: 'resolved_at'
    },
    volume: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0
    },
    totalBets: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_bets'
    },
    totalLiability: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_liability'
    },
    suspended: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    suspensionReason: {
      type: DataTypes.STRING,
      field: 'suspension_reason'
    }
  }, {
    tableName: 'markets',
    timestamps: true
  });

  Market.prototype.isOpen = function() {
    return this.status === 'open' && new Date() < this.closingDate;
  };

  Market.prototype.canAcceptBets = function() {
    return this.isOpen() && !this.suspended;
  };

  Market.prototype.close = async function() {
    this.status = 'closed';
    return this.save();
  };

  Market.prototype.resolve = async function(result) {
    this.result = result;
    this.status = 'resolved';
    this.resolvedAt = new Date();
    return this.save();
  };

  Market.associate = (models) => {
    Market.hasMany(models.Bet, { foreignKey: 'marketId', as: 'bets' });
  };

  return Market;
};
