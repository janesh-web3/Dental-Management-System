const express = require('express');
const router = express.Router();
const smsController = require('../controller/smsController');

console.log('SMS Controller exports:', Object.keys(smsController));
console.log('checkSMSCredit type:', typeof smsController.checkSMSCredit);
console.log('getDetailedSMSCredit type:', typeof smsController.getDetailedSMSCredit);
console.log('getSMSReport type:', typeof smsController.getSMSReport);

// SMS sending endpoints - protected by authentication
router.post('/single', (req, res) => smsController.sendSingleSMS(req, res));
router.post('/bulk', (req, res) => smsController.sendBulkSMS(req, res));

// Template management endpoints - protected by authentication
router.get('/templates', (req, res) => smsController.getTemplates(req, res));
router.post('/templates', (req, res) => smsController.createTemplate(req, res));
router.put('/templates/:templateId', (req, res) => smsController.updateTemplate(req, res));
router.delete('/templates/:templateId', (req, res) => smsController.deleteTemplate(req, res));

// SMS history endpoints - protected by authentication
router.get('/history', (req, res) => smsController.getSMSHistory(req, res));

// Credit management endpoints - protected by authentication
router.get('/credit', (req, res) => smsController.checkSMSCredit(req, res));
router.get('/credit/detailed', (req, res) => smsController.getDetailedSMSCredit(req, res));

// Report endpoints - admin only
router.get('/report', (req, res) => smsController.getSMSReport(req, res));

// Scheduled SMS processing - admin only
router.post('/process-scheduled', (req, res) => smsController.processScheduledSMS(req, res));

// Status callback endpoint - public endpoint (for future use with provider webhooks)
router.post('/status-callback', (req, res) => smsController.smsStatusCallback(req, res));

module.exports = router;
