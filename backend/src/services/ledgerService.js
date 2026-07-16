const { Wallet, LedgerEntry } = require('../models');

/**
 * Ledger service
 * - Ensures a paired double-entry is created for credits (platform debit + user credit)
 * - Updates the user's Wallet balance if present
 * - All DB writes should be done inside a transaction passed via `transaction`
 */

async function createCredit({ userId, amountCents, relatedDepositId, metadata = {}, transaction }) {
  if (!transaction) throw new Error('createCredit requires a transaction');

  // Fetch wallet if exists (inside tx)
  let wallet = null;
  try {
    wallet = await Wallet.findOne({ where: { userId }, transaction });
  } catch (e) {
    // ignore if Wallet model not present
  }

  const balanceBeforeCents = wallet ? Math.round(Number(wallet.balance || 0) * 100) : 0;
  const balanceAfterCents = balanceBeforeCents + Number(amountCents);

  // Create platform counter-entry (debit) -- userId null indicates system/platform account
  const platformEntry = await LedgerEntry.create({
    entryType: 'debit',
    userId: null,
    amountCents,
    currency: 'INR',
    relatedDepositId,
    balanceBeforeCents: null,
    balanceAfterCents: null,
    metadata: { ...metadata, counter: 'platform' }
  }, { transaction });

  // Create user credit entry
  const userEntry = await LedgerEntry.create({
    entryType: 'credit',
    userId,
    amountCents,
    currency: 'INR',
    relatedDepositId,
    balanceBeforeCents,
    balanceAfterCents,
    metadata
  }, { transaction });

  // update wallet if present (assumes wallet.balance stored as decimal rupees)
  if (wallet) {
    const newBalance = (balanceAfterCents / 100).toFixed(2);
    await wallet.update({ balance: newBalance }, { transaction });
  }

  return { platformEntry, userEntry };
}

async function createDebit({ userId, amountCents, relatedWithdrawId, metadata = {}, transaction }) {
  if (!transaction) throw new Error('createDebit requires a transaction');

  // Fetch wallet if exists (inside tx)
  let wallet = null;
  try {
    wallet = await Wallet.findOne({ where: { userId }, transaction });
  } catch (e) {
    // ignore if Wallet model not present
  }

  const balanceBeforeCents = wallet ? Math.round(Number(wallet.balance || 0) * 100) : 0;
  const balanceAfterCents = balanceBeforeCents - Number(amountCents);
  if (wallet && balanceAfterCents < 0) throw new Error('Insufficient balance');

  // Create user debit entry
  const userEntry = await LedgerEntry.create({
    entryType: 'debit',
    userId,
    amountCents,
    currency: 'INR',
    relatedDepositId: relatedWithdrawId,
    balanceBeforeCents,
    balanceAfterCents,
    metadata
  }, { transaction });

  // Create platform credit counter-entry
  const platformEntry = await LedgerEntry.create({
    entryType: 'credit',
    userId: null,
    amountCents,
    currency: 'INR',
    relatedDepositId: relatedWithdrawId,
    balanceBeforeCents: null,
    balanceAfterCents: null,
    metadata: { ...metadata, counter: 'platform' }
  }, { transaction });

  // update wallet if present
  if (wallet) {
    const newBalance = (balanceAfterCents / 100).toFixed(2);
    await wallet.update({ balance: newBalance }, { transaction });
  }

  return { platformEntry, userEntry };
}

module.exports = { createCredit, createDebit };
