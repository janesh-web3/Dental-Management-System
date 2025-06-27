const express = require("express");
const router = express.Router();
const Patient = require("../model/Patient");
const PatientAuth = require("../model/PatientAuth");
const patientAuthMiddleware = require("../middleware/patientAuthMiddleware");
const Appointment = require("../model/Appointment");
const Prescription = require("../model/Prescription");
const { patientLogin, getCurrentPatient, updatePatientPassword, 
  getPatientAppointments, getPatientBills, getPatientMessages } = require("../controller/patientAuthCtrl");

// Patient login route
router.post("/login", patientLogin);

// Get current patient (protected route)
router.get("/me", patientAuthMiddleware, getCurrentPatient);

// Update patient password (protected route)
router.put("/update-password", patientAuthMiddleware, updatePatientPassword);

// Get patient appointments (protected route)
router.get("/:id/appointments", patientAuthMiddleware, getPatientAppointments);

// Get patient bills (protected route)
router.get("/:id/bills", patientAuthMiddleware, getPatientBills);

// Get patient messages (protected route)
router.get("/:id/messages", patientAuthMiddleware, getPatientMessages);

module.exports = router;
