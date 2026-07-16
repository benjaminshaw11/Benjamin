const express = require('express');
const router = express.Router();

// Simple JSON metrics endpoint (expandable)
router.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: Date.now(),
    pending_manual_deposits: 0, // populated in future
    auto_approved_volume_cents: 0
  };
  res.json(metrics);
});

module.exports = router;
