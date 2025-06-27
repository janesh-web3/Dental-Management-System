import express from 'express';
import { getSMSSettings, updateSMSSettings } from '../controllers/smsSettingsController';
import { auth, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// Get SMS settings
router.get('/', auth, getSMSSettings);

// Update SMS settings (Superadmin only)
router.put(
  '/', 
  auth, 
  authorize([UserRole.SUPERADMIN]),
  updateSMSSettings
);

export default router;
