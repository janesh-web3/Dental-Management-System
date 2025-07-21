const express = require("express");
const router = express.Router();
const { 
  addAppointment, 
  getAllAppointment, 
  updateAppointmentStatus, 
  updateAppointment,
  deleteAppointment,
  getDoctorAvailability,
  checkConflicts,
  rescheduleAppointment,
  createFollowUp,
  getPatientsForAppointment,
  getDoctorsForAppointment
} = require("../controller/appointmentCtrl.js");
const patientAuthMiddleware = require("../middleware/patientAuthMiddleware");
const { 
  authenticateUser, 
  authorizePermission, 
  staffOrAdmin 
} = require("../middleware/rbacMiddleware");

// Appointment management routes with RBAC
router.post("/add-appointment", authenticateUser, authorizePermission('appointments', 'create'), addAppointment);
router.get("/get-appointments", authenticateUser, authorizePermission('appointments', 'read'), getAllAppointment);
router.get("/appointment", authenticateUser, authorizePermission('appointments', 'read'), getAllAppointment);
router.put("/update-appointment-status/:id", authenticateUser, authorizePermission('appointments', 'update'), updateAppointmentStatus);
router.put("/update-appointment/:id", authenticateUser, authorizePermission('appointments', 'update'), updateAppointment);
router.delete("/delete-appointment/:id", authenticateUser, authorizePermission('appointments', 'delete'), deleteAppointment);

// Calendar-specific routes
router.get("/doctor-availability", authenticateUser, authorizePermission('appointments', 'read'), getDoctorAvailability);
router.post("/check-conflicts", authenticateUser, authorizePermission('appointments', 'read'), checkConflicts);
router.put("/reschedule/:id", authenticateUser, authorizePermission('appointments', 'update'), rescheduleAppointment);
router.post("/create-followup/:parentId", authenticateUser, authorizePermission('appointments', 'create'), createFollowUp);

// Autocomplete routes for appointment creation
router.get("/patients-autocomplete", authenticateUser, authorizePermission('appointments', 'read'), getPatientsForAppointment);
router.get("/doctors-autocomplete", authenticateUser, authorizePermission('appointments', 'read'), getDoctorsForAppointment);

// Task management routes
router.get("/tasks", authenticateUser, authorizePermission('appointments', 'read'), async (req, res) => {
  try {
    // Placeholder for task management - would need Task model
    res.json([]);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch tasks" });
  }
});

router.post("/tasks", authenticateUser, authorizePermission('appointments', 'create'), async (req, res) => {
  try {
    // Placeholder for task creation - would need Task model
    res.json({ success: true, message: "Task created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
});

router.put("/tasks/:id", authenticateUser, authorizePermission('appointments', 'update'), async (req, res) => {
  try {
    // Placeholder for task update - would need Task model
    res.json({ success: true, message: "Task updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update task" });
  }
});

// Route for patients to update their appointments (patient authentication)
router.put("/appointment/:id", patientAuthMiddleware, updateAppointment);

module.exports = router;