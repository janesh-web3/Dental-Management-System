const express = require('express');
const router = express.Router();
const smsScheduleController = require('../controller/smsScheduleController');
const { protectAdminRoute } = require('../middleware/adminAuthMiddleware');

// All routes require authentication
router.use(protectAdminRoute);

// Schedule an SMS
router.post('/', (req, res) => smsScheduleController.scheduleSMS(req, res));

// Get all scheduled SMS
router.get('/', (req, res) => smsScheduleController.getScheduledSMS(req, res));

// Cancel a scheduled SMS
router.delete('/:id', (req, res) => smsScheduleController.cancelScheduledSMS(req, res));

module.exports = router;