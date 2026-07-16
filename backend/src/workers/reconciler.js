// Simple reconciliation worker with better matching
const fs = require('fs');
const csv = require('csv-parse/lib/sync');
const { ManualDeposit, ManualDepositMatch } = require('../models');

// helper similarity check (case-insensitive includes)
function similar(a = '', b = '') {
  if (!a || !b) return false;
  const A = a.toString().toLowerCase();
  const B = b.toString().toLowerCase();
  return A.includes(B) || B.includes(A);
}

async function reconcileCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const records = csv(content, { columns: true, skip_empty_lines: true });

  for (const rec of records) {
    // expected fields: utr, amount, from_account, to_account, timestamp, remitter
    const amountCents = Math.round(Number(rec.amount) * 100);
    const candidates = await ManualDeposit.findAll({ where: { status: 'pending' }, limit: 50, order: [['createdAt', 'ASC']] });
    // score candidates
    const scored = candidates.map(c => {
      let score = 0;
      if (Number(c.amountCents) === amountCents) score += 50;
      // time window check: within 24h
      if (rec.timestamp && c.createdAt) {
        const dt = Math.abs(new Date(rec.timestamp) - new Date(c.createdAt));
        if (dt < 1000 * 60 * 60 * 24) score += 20;
      }
      if (similar(rec.remitter, c.remitterName)) score += 20;
      if (similar(rec.from_account, c.remitterAccount)) score += 30;
      return { candidate: c, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored[0];
    if (top && top.score >= 70) {
      await ManualDepositMatch.create({ manualDepositId: top.candidate.id, bankTxnId: rec.utr || rec.txn_id, bankAccount: rec.from_account || rec.to_account, amountCents, matchedAt: new Date(), matchConfidence: top.score });
    } else if (top && top.score > 30) {
      // create lower-confidence suggestion
      await ManualDepositMatch.create({ manualDepositId: top.candidate.id, bankTxnId: rec.utr || rec.txn_id, bankAccount: rec.from_account || rec.to_account, amountCents, matchedAt: new Date(), matchConfidence: top.score });
    } else {
      // no good candidate; skip or log
      console.log('No match for record', rec);
    }
  }
}

module.exports = { reconcileCsv };
