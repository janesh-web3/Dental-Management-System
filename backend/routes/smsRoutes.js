const express = require('express');
const router = express.Router();
const smsController = require('../controller/smsController');
const { protectAdminRoute } = require('../middleware/adminAuthMiddleware');
const { optionalAdminAuth } = require('../middleware/optionalAdminAuthMiddleware');

console.log('SMS Controller exports:', Object.keys(smsController));
console.log('checkSMSCredit type:', typeof smsController.checkSMSCredit);
console.log('getDetailedSMSCredit type:', typeof smsController.getDetailedSMSCredit);
console.log('getSMSReport type:', typeof smsController.getSMSReport);

// SMS sending endpoints - protected by authentication
router.post('/single', protectAdminRoute, (req, res) => smsController.sendSingleSMS(req, res));
router.post('/bulk', protectAdminRoute, (req, res) => smsController.sendBulkSMS(req, res));

// New endpoints for follow-up and payment reminders with custom messages
router.post('/followup/:patientId', protectAdminRoute, (req, res) => smsController.sendFollowUpReminder(req, res));
router.post('/payment-due/:patientId', protectAdminRoute, (req, res) => smsController.sendPaymentReminder(req, res));
router.post('/custom/:patientId', protectAdminRoute, (req, res) => smsController.sendCustomSMS(req, res)); // Add this new route
router.get('/patients-with-followup', protectAdminRoute, (req, res) => smsController.getPatientsWithFollowUp(req, res));
router.post('/bulk-followup', protectAdminRoute, (req, res) => smsController.sendBulkFollowUpReminders(req, res));

// Template management endpoints - protected by authentication
router.get('/templates', protectAdminRoute, (req, res) => smsController.getTemplates(req, res));
router.post('/templates', protectAdminRoute, (req, res) => smsController.createTemplate(req, res));
router.put('/templates/:templateId', protectAdminRoute, (req, res) => smsController.updateTemplate(req, res));
router.delete('/templates/:templateId', protectAdminRoute, (req, res) => smsController.deleteTemplate(req, res));

// SMS history endpoints - protected by authentication
router.get('/history', protectAdminRoute, (req, res) => smsController.getSMSHistory(req, res));

// Credit management endpoints - protected by authentication
router.get('/credit', protectAdminRoute, (req, res) => smsController.checkSMSCredit(req, res));
router.get('/credit/detailed', protectAdminRoute, (req, res) => smsController.getDetailedSMSCredit(req, res));

// Report endpoints - admin only
router.get('/report', protectAdminRoute, (req, res) => smsController.getSMSReport(req, res));

// Scheduled SMS processing - admin only
router.post('/process-scheduled', (req, res) => smsController.processScheduledSMS(req, res));

// Status callback endpoint - public endpoint (for future use with provider webhooks)
router.post('/status-callback', (req, res) => smsController.smsStatusCallback(req, res));

// Class-based SMS endpoints - protected by authentication
router.get('/class-configs', protectAdminRoute, (req, res) => smsController.getSMSClassConfigs(req, res));
router.put('/class-configs/:className', protectAdminRoute, (req, res) => smsController.updateSMSClassConfig(req, res));

// Campaign management endpoints
router.post('/campaigns', protectAdminRoute, (req, res) => smsController.createSMSCampaign(req, res));
router.get('/campaigns', protectAdminRoute, (req, res) => smsController.getSMSCampaigns(req, res));
router.get('/campaigns/:campaignId', protectAdminRoute, (req, res) => smsController.getCampaignDetails(req, res));
router.post('/campaigns/:campaignId/send/:className', protectAdminRoute, (req, res) => smsController.sendSMSToClass(req, res));

// Class-based SMS history
router.get('/history-by-class', protectAdminRoute, (req, res) => smsController.getSMSHistoryByClass(req, res));

module.exports = router;
