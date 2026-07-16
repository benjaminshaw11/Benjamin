const { Wallet, LedgerEntry } = require('../models');

async function createCredit({ userId, amountCents, relatedDepositId, metadata = {}, transaction }) {
  // Fetch wallet if exists
  let wallet = null;
  try {
    wallet = await Wallet.findOne({ where: { userId }, transaction });
  } catch (e) {
    // ignore if Wallet model not present
  }

  const balanceBeforeCents = wallet ? Math.round(Number(wallet.balance || 0) * 100) : 0;
  const balanceAfterCents = balanceBeforeCents + Number(amountCents);

  // create ledger entry
  const entry = await LedgerEntry.create({
    entryType: 'credit', userId, amountCents, currency: 'INR', relatedDepositId,
    balanceBeforeCents, balanceAfterCents, metadata
  }, { transaction });

  // update wallet if present (assumes wallet.balance stored in rupees decimal)
  if (wallet) {
    const newBalance = (balanceAfterCents / 100).toFixed(2);
    await wallet.update({ balance: newBalance }, { transaction });
  }

  return entry;
}

module.exports = { createCredit };
