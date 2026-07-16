const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const User = require('./User')(sequelize);
const Wallet = require('./Wallet')(sequelize);
const Bet = require('./Bet')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const PredictionMarket = require('./PredictionMarket')(sequelize);
const PredictionBet = require('./PredictionBet')(sequelize);
const ManualDeposit = require('./ManualDeposit')(sequelize);
const ManualDepositMatch = require('./ManualDepositMatch')(sequelize);
const LedgerEntry = require('./LedgerEntry')(sequelize);
const AdminAuditLog = require('./AdminAuditLog')(sequelize);

// Associations
User.hasOne(Wallet, { foreignKey: 'userId', onDelete: 'CASCADE' });
Wallet.belongsTo(User);

User.hasMany(Bet, { foreignKey: 'userId', onDelete: 'CASCADE' });
Bet.belongsTo(User);

User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User);

User.hasMany(PredictionBet, { foreignKey: 'userId', onDelete: 'CASCADE' });
PredictionBet.belongsTo(User);

PredictionMarket.hasMany(PredictionBet, { foreignKey: 'marketId', onDelete: 'CASCADE' });
PredictionBet.belongsTo(PredictionMarket);

// Manual deposit associations
User.hasMany(ManualDeposit, { foreignKey: 'userId', onDelete: 'CASCADE' });
ManualDeposit.belongsTo(User);
ManualDeposit.hasMany(ManualDepositMatch, { foreignKey: 'manualDepositId' });
ManualDepositMatch.belongsTo(ManualDeposit);

// Ledger associations
User.hasMany(LedgerEntry, { foreignKey: 'userId' });
LedgerEntry.belongsTo(User);

module.exports = {
  sequelize,
  User,
  Wallet,
  Bet,
  Transaction,
  PredictionMarket,
  PredictionBet,
  ManualDeposit,
  ManualDepositMatch,
  LedgerEntry,
  AdminAuditLog
};
