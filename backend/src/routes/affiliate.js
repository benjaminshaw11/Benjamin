const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { User, Affiliate, Referral, Wallet, Transaction } = require('../models');
const AffiliateSystem = require('../utils/affiliateSystem');

const router = express.Router();

// Register as affiliate
router.post('/register', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const existingAffiliate = await Affiliate.findOne({ where: { userId } });
    if (existingAffiliate) {
      return res.status(400).json({ error: 'Already registered as affiliate' });
    }

    const referralCode = AffiliateSystem.generateReferralCode(userId);

    const affiliate = await Affiliate.create({
      userId,
      referralCode,
      totalReferrals: 0,
      activeReferrals: 0,
      totalCommission: 0,
      currentTier: 'tier1'
    });

    res.json({
      message: 'Successfully registered as affiliate',
      referralCode: affiliate.referralCode,
      affiliateId: affiliate.id
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get affiliate dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const affiliate = await Affiliate.findOne({ where: { userId: req.user.id } });
    if (!affiliate) {
      return res.status(404).json({ error: 'Not registered as affiliate' });
    }

    const referrals = await Referral.findAll({ where: { affiliateId: affiliate.id } });
    const tier = AffiliateSystem.getAffiliateTier(affiliate.totalReferrals);
    const nextTier = AffiliateSystem.getNextTierRequirements(affiliate.totalReferrals);

    const stats = {
      referralCode: affiliate.referralCode,
      totalReferrals: affiliate.totalReferrals,
      activeReferrals: affiliate.activeReferrals,
      totalCommission: affiliate.totalCommission,
      pendingCommission: affiliate.pendingCommission,
      withdrawnCommission: affiliate.withdrawnCommission,
      currentTier: tier,
      nextTier,
      referrals: referrals.map(r => ({
        id: r.id,
        joinedDate: r.joinedDate,
        totalDeposits: r.totalDeposits,
        totalBets: r.totalBets,
        netProfit: r.netProfit,
        status: r.status
      }))
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get affiliate commission details
router.get('/commissions', authMiddleware, async (req, res) => {
  try {
    const affiliate = await Affiliate.findOne({ where: { userId: req.user.id } });
    if (!affiliate) {
      return res.status(404).json({ error: 'Not registered as affiliate' });
    }

    const referrals = await Referral.findAll({ where: { affiliateId: affiliate.id } });
    const tier = AffiliateSystem.getAffiliateTier(affiliate.totalReferrals);

    const commissionBreakdown = referrals.map(ref => ({
      referredUser: ref.referredUserId,
      netProfit: ref.netProfit,
      commission: AffiliateSystem.calculateCommission(ref.netProfit, tier.commission),
      status: ref.status
    }));

    const totalCommission = AffiliateSystem.calculateTotalEarnings(referrals);

    res.json({
      tier,
      commissionRate: `${tier.commission * 100}%`,
      totalCommission,
      breakdown: commissionBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Withdraw commission
router.post('/withdraw-commission', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    const affiliate = await Affiliate.findOne({ where: { userId } });
    if (!affiliate) {
      return res.status(404).json({ error: 'Not registered as affiliate' });
    }

    if (affiliate.pendingCommission < amount) {
      return res.status(400).json({ error: 'Insufficient pending commission' });
    }

    // Create withdrawal transaction
    const transaction = await Transaction.create({
      userId,
      type: 'withdrawal',
      amount,
      status: 'pending',
      description: 'Affiliate commission withdrawal'
    });

    affiliate.pendingCommission -= amount;
    affiliate.withdrawnCommission += amount;
    await affiliate.save();

    res.json({
      message: 'Withdrawal request submitted',
      transactionId: transaction.id,
      newPendingCommission: affiliate.pendingCommission
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
