const fs = require('fs');
const path = require('path');
const { ManualDepositMatch, ManualDeposit, AdminAuditLog, sequelize } = require('../models');
const ledgerService = require('../services/ledgerService');

// Accept a suggested match: marks match accepted, performs deposit approve idempotently
async function acceptMatch(req, res) {
  const adminId = req.user && req.user.id;
  const matchId = req.params.matchId;
  const idempotencyKey = req.get('Idempotency-Key') || req.body.idempotency_key;

  const match = await ManualDepositMatch.findByPk(matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  const deposit = await ManualDeposit.findByPk(match.manualDepositId);
  if (!deposit || deposit.status !== 'pending') return res.status(400).json({ error: 'Deposit invalid or not pending' });

  // Idempotency check
  const prev = idempotencyKey ? await AdminAuditLog.findOne({ where: { idempotencyKey } }) : null;
  if (prev) return res.status(200).json({ ok: true, note: 'Already processed' });

  try {
    await sequelize.transaction(async (tx) => {
      // Approve deposit using ledgerService
      await ledgerService.createCredit({ userId: deposit.userId, amountCents: deposit.amountCents, relatedDepositId: deposit.id, metadata: { matchedBy: matchId }, transaction: tx });

      // Mark deposit approved and mark match as used
      await deposit.update({ status: 'approved' }, { transaction: tx });
      await match.update({ matchedAt: new Date(), matchedByAdminId: adminId, matchConfidence: match.matchConfidence || 100 }, { transaction: tx });

      // Audit log
      await AdminAuditLog.create({ adminId, action: 'accept_match', targetType: 'manual_deposit_match', targetId: match.id, idempotencyKey, metadata: { depositId: deposit.id } }, { transaction: tx });
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error('acceptMatch error', e);
    return res.status(500).json({ error: 'Accept match failed' });
  }
}

// Simple evidence upload handler delegates to storageService
async function uploadEvidence(req, res) {
  try {
    const depositId = req.params.id;
    const deposit = await ManualDeposit.findByPk(depositId);
    if (!deposit) return res.status(404).json({ error: 'Deposit not found' });

    // Expect body { filename, dataBase64 }
    const { filename, dataBase64 } = req.body;
    if (!filename || !dataBase64) return res.status(400).json({ error: 'filename and dataBase64 required' });

    const storage = require('../services/storageService');
    const saved = await storage.saveEvidence(depositId, filename, dataBase64);

    await deposit.update({ evidencePath: saved.path });

    return res.json({ ok: true, path: saved.path });
  } catch (e) {
    console.error('uploadEvidence error', e);
    return res.status(500).json({ error: 'Upload failed' });
  }
}

module.exports = { acceptMatch, uploadEvidence };
