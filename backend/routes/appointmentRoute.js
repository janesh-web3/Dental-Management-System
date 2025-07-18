const express = require("express");
const router = express.Router();
const { addAppointment, getAllAppointment, updateAppointmentStatus, updateAppointment } = require("../controller/appointmentCtrl.js");
const patientAuthMiddleware = require("../middleware/patientAuthMiddleware");
const { 
  authenticateUser, 
  authorizePermission, 
  staffOrAdmin 
} = require("../middleware/rbacMiddleware");

// Appointment management routes with RBAC
router.post("/add-appointment", authenticateUser, authorizePermission('appointments', 'create'), addAppointment);
router.get("/appointment", authenticateUser, authorizePermission('appointments', 'read'), getAllAppointment);
router.put("/update-appointment-status/:id", authenticateUser, authorizePermission('appointments', 'update'), updateAppointmentStatus);

// Route for patients to update their appointments (patient authentication)
router.put("/appointment/:id", patientAuthMiddleware, updateAppointment);

module.exports = router;