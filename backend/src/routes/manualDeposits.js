const express = require('express');
const router = express.Router();
const controller = require('../controllers/manualDepositsController');
const reconcilerController = require('../controllers/reconcilerController');
const { checkAdmin } = require('../middleware/auth');

router.get('/pending', checkAdmin, controller.listPending);
router.post('/admin/:id/approve', checkAdmin, controller.approve);
router.post('/admin/:id/reject', checkAdmin, controller.reject);

// Accept a suggested match (admin)
router.post('/matches/:matchId/accept', checkAdmin, reconcilerController.acceptMatch);

// Upload evidence for a deposit (admin)
router.post('/:id/evidence', checkAdmin, reconcilerController.uploadEvidence);

module.exports = router;
