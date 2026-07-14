const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const User = require('./User')(sequelize);
const Wallet = require('./Wallet')(sequelize);
const Bet = require('./Bet')(sequelize);
const Transaction = require('./Transaction')(sequelize);

// Associations
User.hasOne(Wallet, { foreignKey: 'userId', onDelete: 'CASCADE' });
Wallet.belongsTo(User);

User.hasMany(Bet, { foreignKey: 'userId', onDelete: 'CASCADE' });
Bet.belongsTo(User);

User.hasMany(Transaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
Transaction.belongsTo(User);

module.exports = {
  sequelize,
  User,
  Wallet,
  Bet,
  Transaction
};
