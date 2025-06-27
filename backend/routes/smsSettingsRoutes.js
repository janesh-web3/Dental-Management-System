const express = require('express');
const router = express.Router();
const { protectAdminRoute } = require('../middleware/adminAuthMiddleware');
const { getSMSSettings, updateSMSSettings } = require('../controller/smsSettingsController');

// Get SMS settings - any admin can view
router.get('/', protectAdminRoute, getSMSSettings);

// Update SMS settings - only superadmin can update
router.put('/', protectAdminRoute, updateSMSSettings);

module.exports = router;
