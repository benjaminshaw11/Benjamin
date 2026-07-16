@@
 router.post('/withdraw', authMiddleware, async (req, res) => {
   const { amount, account } = req.body;
   const userId = req.user.id;
-  // existing withdraw flow ...
+  // enforce progressive KYC: withdrawals require full KYC
+  const user = await User.findByPk(userId);
+  if (!user) return res.status(404).json({ error: 'User not found' });
+  if (!user.kycVerified) return res.status(403).json({ error: 'Complete KYC to withdraw funds' });
+
+  // existing withdraw flow continues below
