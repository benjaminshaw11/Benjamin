const express = require('express');
const router = express.Router();
const controller = require('../controllers/manualDepositsController');
const { checkAdmin } = require('../middleware/auth');

router.get('/pending', checkAdmin, controller.listPending);
router.post('/admin/:id/approve', checkAdmin, controller.approve);
router.post('/admin/:id/reject', checkAdmin, controller.reject);

module.exports = router;
