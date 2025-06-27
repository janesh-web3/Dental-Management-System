import express from 'express';
import { 
  sendSingleSMSHandler, 
  sendBulkSMSHandler, 
  sendFollowUpSMS, 
  sendPaymentReminderSMS,
  getSMSCredit
} from '../controllers/smsController';
import { auth, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// Single SMS route
router.post('/single', auth, authorize([UserRole.ADMIN, UserRole.RECEPTIONIST]), sendSingleSMSHandler);

// Bulk SMS route
router.post('/bulk', auth, authorize([UserRole.ADMIN]), sendBulkSMSHandler);

// Follow-up SMS route
router.post('/followup/:patientId', auth, authorize([UserRole.ADMIN, UserRole.RECEPTIONIST]), sendFollowUpSMS);

// Payment reminder SMS route
router.post('/payment-due/:patientId', auth, authorize([UserRole.ADMIN, UserRole.RECEPTIONIST]), sendPaymentReminderSMS);

// Get SMS credit
router.get('/credit', auth, authorize([UserRole.ADMIN]), getSMSCredit);

export default router;
