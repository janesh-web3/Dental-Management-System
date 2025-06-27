import express from 'express';
import { 
  searchPatients,
  getFilteredPatients,
  getPatientsCount
} from '../controllers/patientController';
import { auth, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = express.Router();

// Search patients
router.post('/search', auth, authorize([UserRole.ADMIN, UserRole.RECEPTIONIST]), searchPatients);

// Get filtered patients
router.post('/', auth, authorize([UserRole.ADMIN, UserRole.RECEPTIONIST]), getFilteredPatients);

// Get count of filtered patients
router.post('/count', auth, authorize([UserRole.ADMIN, UserRole.RECEPTIONIST]), getPatientsCount);

export default router;
