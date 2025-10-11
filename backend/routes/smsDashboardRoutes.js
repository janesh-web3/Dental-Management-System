const express = require('express');
const router = express.Router();
const smsDashboardController = require('../controller/smsDashboardController');
const { protectAdminRoute } = require('../middleware/adminAuthMiddleware');

// All routes require authentication
router.use(protectAdminRoute);

// Get SMS dashboard statistics
router.get('/stats', (req, res) => smsDashboardController.getSMSDashboardStats(req, res));

// Get detailed SMS history with filtering
router.get('/history', (req, res) => smsDashboardController.getDetailedSMSHistory(req, res));

// Get template usage analytics
router.get('/analytics/templates', (req, res) => smsDashboardController.getTemplateAnalytics(req, res));

// Get SMS cost analytics
router.get('/analytics/costs', (req, res) => smsDashboardController.getSMSCostAnalytics(req, res));

module.exports = router;