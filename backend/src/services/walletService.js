const { sequelize } = require('../models');

const Wallet = sequelize.models.Wallet;
const Transaction = sequelize.models.Transaction;

async function getOrCreateWallet(userId, options = {}) {
  let wallet = await Wallet.findOne({ where: { userId }, transaction: options.transaction, lock: options.transaction ? options.transaction.LOCK.UPDATE : undefined });
  if (!wallet) {
    wallet = await Wallet.create({ userId }, { transaction: options.transaction });
  }
  return wallet;
}

async function creditWallet(userId, amount, meta = {}) {
  return sequelize.transaction(async (t) => {
    const wallet = await getOrCreateWallet(userId, { transaction: t });
    const newBalance = (parseFloat(wallet.balance) + parseFloat(amount)).toFixed(2);
    wallet.balance = newBalance;
    await wallet.save({ transaction: t });

    await Transaction.create({
      walletId: wallet.id,
      type: 'credit',
      amount,
      balanceAfter: newBalance,
      meta,
    }, { transaction: t });

    return wallet;
  });
}

async function debitWallet(userId, amount, meta = {}) {
  return sequelize.transaction(async (t) => {
    const wallet = await getOrCreateWallet(userId, { transaction: t });
    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      const err = new Error('Insufficient funds');
      err.status = 400;
      throw err;
    }
    const newBalance = (parseFloat(wallet.balance) - parseFloat(amount)).toFixed(2);
    wallet.balance = newBalance;
    await wallet.save({ transaction: t });

    await Transaction.create({
      walletId: wallet.id,
      type: 'debit',
      amount,
      balanceAfter: newBalance,
      meta,
    }, { transaction: t });

    return wallet;
  });
}

async function transfer(fromUserId, toUserId, amount, meta = {}) {
  return sequelize.transaction(async (t) => {
    // Lock both wallets rows by selecting for update
    const fromWallet = await getOrCreateWallet(fromUserId, { transaction: t });
    const toWallet = await getOrCreateWallet(toUserId, { transaction: t });

    // Reload with lock
    await fromWallet.reload({ transaction: t, lock: t.LOCK.UPDATE });
    await toWallet.reload({ transaction: t, lock: t.LOCK.UPDATE });

    if (parseFloat(fromWallet.balance) < parseFloat(amount)) {
      const err = new Error('Insufficient funds for transfer');
      err.status = 400;
      throw err;
    }

    const fromNew = (parseFloat(fromWallet.balance) - parseFloat(amount)).toFixed(2);
    const toNew = (parseFloat(toWallet.balance) + parseFloat(amount)).toFixed(2);

    fromWallet.balance = fromNew;
    toWallet.balance = toNew;

    await fromWallet.save({ transaction: t });
    await toWallet.save({ transaction: t });

    await Transaction.create({
      walletId: fromWallet.id,
      type: 'debit',
      amount,
      balanceAfter: fromNew,
      meta: { ...meta, transferTo: toWallet.id },
    }, { transaction: t });

    await Transaction.create({
      walletId: toWallet.id,
      type: 'credit',
      amount,
      balanceAfter: toNew,
      meta: { ...meta, transferFrom: fromWallet.id },
    }, { transaction: t });

    return { from: fromWallet, to: toWallet };
  });
}

module.exports = { creditWallet, debitWallet, transfer };
