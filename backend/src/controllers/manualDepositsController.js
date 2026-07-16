const { ManualDeposit, ManualDepositMatch, AdminAuditLog, LedgerEntry, sequelize, User } = require('../models');
const ledgerService = require('../services/ledgerService');
const { canAutoApproveWithoutKyc } = require('../services/kycPolicy');

async function listPending(req, res) {
@@
}

async function getMatches(req, res) {
  const depositId = req.params.id;
  const matches = await ManualDepositMatch.findAll({ where: { manualDepositId: depositId }, order: [['match_confidence', 'DESC']] });
  res.json({ rows: matches });
}

async function acceptMatch(req, res) {
  const adminId = req.user && req.user.id;
  const depositId = req.params.id;
  const { bankTxnId } = req.body;
  if (!bankTxnId) return res.status(400).json({ error: 'bankTxnId required' });

  const deposit = await ManualDeposit.findByPk(depositId);
  if (!deposit) return res.status(404).json({ error: 'deposit not found' });

  try {
    await sequelize.transaction(async (tx) => {
      // create match record
      await ManualDepositMatch.create({ manualDepositId: deposit.id, bankTxnId, amountCents: deposit.amountCents, matchedAt: new Date(), matchedByAdminId: adminId, matchConfidence: 90 }, { transaction: tx });

      // call approve logic programmatically by reusing existing approve path behaviour
      // re-use audit idempotency by creating a synthetic key
      const idempotencyKey = `match-accept-${deposit.id}-${bankTxnId}`;
      // create ledger credit
      await ledgerService.createCredit({ userId: deposit.userId, amountCents: deposit.amountCents, relatedDepositId: deposit.id, transaction: tx });
      await deposit.update({ status: 'approved' }, { transaction: tx });
      await AdminAuditLog.create({ adminId, action: 'accept_match_and_approve', targetType: 'manual_deposit', targetId: deposit.id, idempotencyKey, metadata: { bankTxnId } }, { transaction: tx });

      // update user's cumulative deposits (stored in rupees decimal)
      const user = await User.findByPk(deposit.userId, { transaction: tx });
      const addRupees = (Number(deposit.amountCents) / 100).toFixed(2);
      const newTotal = (Number(user.totalDeposits || 0) + Number(addRupees)).toFixed(2);
      await user.update({ totalDeposits: newTotal }, { transaction: tx });
      if (!user.kycVerified) {
        await user.update({ needsKycBeforeWithdrawal: true }, { transaction: tx });
      }
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error('acceptMatch error', e);
    return res.status(500).json({ error: 'Accept failed' });
  }
}

async function approve(req, res) {
@@
}

async function reject(req, res) {
@@
}

module.exports = { listPending, getMatches, acceptMatch, approve, reject };
