const express = require('express');
const router = express.Router();
const { sendSingleSMS, sendBulkSMS } = require('../controller/smsController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes - only authenticated users can send SMS
router.post('/single', authMiddleware, sendSingleSMS);
router.post('/bulk', authMiddleware, sendBulkSMS);

module.exports = router; 