const { ManualDeposit, ManualDepositMatch, AdminAuditLog, LedgerEntry, sequelize, User } = require('../models');
const ledgerService = require('../services/ledgerService');

async function isUserKycApproved(userId) {
  try {
    const user = await User.findByPk(userId);
    if (!user) return false;
    // permissive if no kyc field
    if (user.kycStatus === undefined) return true;
    return (user.kycStatus === 'approved' || user.kycStatus === 'verified');
  } catch (e) {
    return true;
  }
}

async function listPending(req, res) {
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = parseInt(req.query.offset, 10) || 0;
  const q = req.query.q || '';

  const where = { status: 'pending' };
  if (q) {
    // simple search by id or remitter
    where[sequelize.Op.or] = [
      { id: q },
      { remitterName: { [sequelize.Op.iLike]: `%${q}%` } },
      { providedReference: { [sequelize.Op.iLike]: `%${q}%` } }
    ];
  }

  const { count, rows } = await ManualDeposit.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
  res.json({ total: count, rows });
}

async function approve(req, res) {
  const adminId = req.user && req.user.id;
  const depositId = req.params.id;
  const idempotencyKey = req.get('Idempotency-Key') || req.body.idempotency_key || req.body.idempotencyKey;
  const matchedBankTxnId = req.body.matched_bank_txn_id || req.body.matchedBankTxnId || null;

  if (!idempotencyKey) {
    // warn but allow (recommendation: require idempotency)
    console.warn('approve called without idempotency key');
  }

  const prev = idempotencyKey ? await AdminAuditLog.findOne({ where: { idempotencyKey } }) : null;
  if (prev) return res.status(200).json({ ok: true, note: 'Already processed' });

  const deposit = await ManualDeposit.findByPk(depositId);
  if (!deposit || deposit.status !== 'pending') return res.status(400).json({ error: 'Invalid deposit' });

  if (!await isUserKycApproved(deposit.userId)) return res.status(403).json({ error: 'User KYC required' });

  try {
    await sequelize.transaction(async (tx) => {
      // create ledger credit
      await ledgerService.createCredit({ userId: deposit.userId, amountCents: deposit.amountCents, relatedDepositId: deposit.id, transaction: tx });

      // mark as approved
      await deposit.update({ status: 'approved' }, { transaction: tx });

      // create match record if provided
      if (matchedBankTxnId) {
        await ManualDepositMatch.create({ manualDepositId: deposit.id, bankTxnId: matchedBankTxnId, amountCents: deposit.amountCents, matchedAt: new Date(), matchedByAdminId: adminId }, { transaction: tx });
      }

      // audit log
      await AdminAuditLog.create({ adminId, action: 'approve', targetType: 'manual_deposit', targetId: deposit.id, idempotencyKey }, { transaction: tx });
    });

    // notify / emit (optional)
    // TODO: emit socket event to user

    return res.json({ ok: true });
  } catch (e) {
    console.error('approve error', e);
    return res.status(500).json({ error: 'Approve failed' });
  }
}

async function reject(req, res) {
  const adminId = req.user && req.user.id;
  const depositId = req.params.id;
  const reason = req.body.reason || '';
  const idempotencyKey = req.get('Idempotency-Key') || req.body.idempotency_key || req.body.idempotencyKey;

  const prev = idempotencyKey ? await AdminAuditLog.findOne({ where: { idempotencyKey } }) : null;
  if (prev) return res.status(200).json({ ok: true, note: 'Already processed' });

  const deposit = await ManualDeposit.findByPk(depositId);
  if (!deposit || deposit.status !== 'pending') return res.status(400).json({ error: 'Invalid deposit' });

  try {
    await sequelize.transaction(async (tx) => {
      await deposit.update({ status: 'rejected' }, { transaction: tx });
      await AdminAuditLog.create({ adminId, action: 'reject', targetType: 'manual_deposit', targetId: deposit.id, reason, idempotencyKey }, { transaction: tx });
    });

    // notify user
    return res.json({ ok: true });
  } catch (e) {
    console.error('reject error', e);
    return res.status(500).json({ error: 'Reject failed' });
  }
}

module.exports = { listPending, approve, reject };
