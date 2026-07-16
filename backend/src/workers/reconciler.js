const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/lib/sync');
const { ManualDeposit, ManualDepositMatch, sequelize } = require('../models');

function scoreMatch(candidate, record) {
  // Simple scoring: exact amount match = +50, remitter/account match = +30, time proximity = +20
  let score = 0;
  if (Number(candidate.amountCents) === Number(record.amountCents)) score += 50;
  if (record.from_account && candidate.remitterAccount && record.from_account === candidate.remitterAccount) score += 30;
  if (record.remitter_name && candidate.remitterName && record.remitter_name.toLowerCase().includes((candidate.remitterName || '').toLowerCase())) score += 20;
  // time proximity not implemented in record (CSV must contain timestamp)
  return Math.min(100, score);
}

async function reconcileCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const records = csv(content, { columns: true, skip_empty_lines: true });

  for (const rec of records) {
    const amountCents = Math.round(Number(rec.amount) * 100);
    // Find pending deposits within small window by amount
    const candidates = await ManualDeposit.findAll({ where: { amountCents, status: 'pending' }, limit: 10 });
    if (!candidates || candidates.length === 0) continue;

    // score candidates
    for (const c of candidates) {
      const score = scoreMatch(c, { amountCents, from_account: rec.from_account, remitter_name: rec.remitter_name });
      // create a suggestion only if score >= 40
      if (score >= 40) {
        await ManualDepositMatch.create({ manualDepositId: c.id, bankTxnId: rec.utr || rec.txn_id, bankAccount: rec.from_account || rec.to_account, amountCents, matchConfidence: score });
      }
    }
  }
}

module.exports = { reconcileCsv };
