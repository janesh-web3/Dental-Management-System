const express = require('express');
const router = express.Router();
const patientGroupController = require('../controller/patientGroupController');
const { protectAdminRoute } = require('../middleware/adminAuthMiddleware');

// All routes require authentication
router.use(protectAdminRoute);

// Create a new patient group
router.post('/', (req, res) => patientGroupController.createPatientGroup(req, res));

// Get all patient groups with pagination
router.get('/', (req, res) => patientGroupController.getPatientGroups(req, res));

// Get a single patient group by ID
router.get('/:id', (req, res) => patientGroupController.getPatientGroupById(req, res));

// Update a patient group
router.put('/:id', (req, res) => patientGroupController.updatePatientGroup(req, res));

// Delete a patient group
router.delete('/:id', (req, res) => patientGroupController.deletePatientGroup(req, res));

// Get patients for a group
router.get('/:id/patients', (req, res) => patientGroupController.getGroupPatients(req, res));

// Filter patients for creating groups
router.post('/filter-patients', (req, res) => patientGroupController.filterPatientsForGroup(req, res));

module.exports = router;