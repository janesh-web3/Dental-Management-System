const express = require('express');
const router = express.Router();
const smsDeliveryController = require('../controller/smsDeliveryController');
const { protectAdminRoute } = require('../middleware/adminAuthMiddleware');

// Webhook endpoint for Aakash SMS delivery reports (public endpoint)
router.post('/delivery-report', smsDeliveryController.handleDeliveryReport);

// Protected routes for admin access
router.get('/delivery-reports', protectAdminRoute, smsDeliveryController.getDeliveryReports);
router.post('/retry-failed/:reportId', protectAdminRoute, smsDeliveryController.retryFailedSMS);
router.get('/delivery-stats', protectAdminRoute, smsDeliveryController.getDeliveryStats);

module.exports = router;