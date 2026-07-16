// Simple reconciliation worker skeleton - ingests CSV and suggests matches
const fs = require('fs');
const csv = require('csv-parse/lib/sync');
const { ManualDeposit, ManualDepositMatch } = require('../models');

async function reconcileCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const records = csv(content, { columns: true, skip_empty_lines: true });

  for (const rec of records) {
    // rec should have fields: utr, amount, from_account, to_account, timestamp
    const amountCents = Math.round(Number(rec.amount) * 100);
    // find pending manual deposits for same amount within a time window
    const candidates = await ManualDeposit.findAll({ where: { amountCents, status: 'pending' }, limit: 5 });
    if (candidates && candidates.length > 0) {
      // naive: take first candidate as suggestion
      const candidate = candidates[0];
      await ManualDepositMatch.create({ manualDepositId: candidate.id, bankTxnId: rec.utr || rec.txn_id, bankAccount: rec.from_account || rec.to_account, amountCents, matchedAt: new Date(), matchConfidence: 80 });
    }
  }
}

module.exports = { reconcileCsv };
