const cfg = {
  AUTO_APPROVE_NO_KYC_THRESHOLD_CENTS: Number(process.env.AUTO_APPROVE_NO_KYC_THRESHOLD_CENTS || 5000),
  KYC_REQUIRED_AFTER_TOTAL_CENTS: Number(process.env.KYC_REQUIRED_AFTER_TOTAL_CENTS || 200000),
  MAX_WAGER_WITHOUT_KYC_CENTS: Number(process.env.MAX_WAGER_WITHOUT_KYC_CENTS || 10000),
  HIGH_RISK_MANUAL_REVIEW_THRESHOLD_CENTS: Number(process.env.HIGH_RISK_MANUAL_REVIEW_THRESHOLD_CENTS || 50000),
};

/**
 * Determine whether a user can be auto-approved/auto-credited without full KYC.
 * Rules:
 * - If user.kycVerified === true => approved
 * - Must have phone verified (phoneVerified true)
 * - depositAmountCents must be <= AUTO_APPROVE_NO_KYC_THRESHOLD_CENTS
 * - total deposits after this must be <= KYC_REQUIRED_AFTER_TOTAL_CENTS
 */
async function canAutoApproveWithoutKyc(user, depositAmountCents) {
  if (!user) return false;
  if (user.kycVerified) return true;
  if (!user.phoneVerified) return false;

  const currentTotalDepositsCents = Math.round((Number(user.totalDeposits || 0) || 0) * 100);
  if (depositAmountCents > cfg.AUTO_APPROVE_NO_KYC_THRESHOLD_CENTS) return false;
  if ((currentTotalDepositsCents + depositAmountCents) > cfg.KYC_REQUIRED_AFTER_TOTAL_CENTS) return false;
  return true;
}

module.exports = { cfg, canAutoApproveWithoutKyc };
