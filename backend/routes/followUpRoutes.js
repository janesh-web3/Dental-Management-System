const express = require("express");
const router = express.Router();
const { 
  authenticateUser, 
  authorizePermission 
} = require("../middleware/rbacMiddleware");
const {
  addFollowUp,
  getPatientFollowUps,
  getFollowUpsByType,
  updateFollowUp,
  deleteFollowUp,
  getUpcomingFollowUps
} = require("../controller/followUpController");

// Add a new follow-up to a patient's treatment plan
router.post(
  "/:id/add", 
  authenticateUser, 
  authorizePermission('patients', 'update'), 
  addFollowUp
);

// Get all follow-ups for a specific patient
router.get(
  "/:id", 
  authenticateUser, 
  authorizePermission('patients', 'read'), 
  getPatientFollowUps
);

// Get follow-ups by type for a specific patient
router.get(
  "/:id/type/:type", 
  authenticateUser, 
  authorizePermission('patients', 'read'), 
  getFollowUpsByType
);

// Update a specific follow-up
router.put(
  "/:id/followup/:fid", 
  authenticateUser, 
  authorizePermission('patients', 'update'), 
  updateFollowUp
);

// Delete a specific follow-up
router.delete(
  "/:id/followup/:fid", 
  authenticateUser, 
  authorizePermission('patients', 'delete'), 
  deleteFollowUp
);

// Get upcoming follow-ups for all patients (dashboard/calendar view)
router.get(
  "/", 
  authenticateUser, 
  authorizePermission('patients', 'read'), 
  getUpcomingFollowUps
);

module.exports = router;