const express = require("express");
const router = express.Router();
const patientAuthCtrl = require("../controller/patientAuthCtrl");
const patientAuthMiddleware = require("../middleware/patientAuthMiddleware");

// Public routes
router.post("/login", patientAuthCtrl.patientLogin);

// Protected routes
router.get("/me", patientAuthMiddleware, patientAuthCtrl.getCurrentPatient);
router.put("/update-password", patientAuthMiddleware, patientAuthCtrl.updatePatientPassword);
router.get("/:id/appointments", patientAuthMiddleware, patientAuthCtrl.getPatientAppointments);
router.get("/:id/bills", patientAuthMiddleware, patientAuthCtrl.getPatientBills);
router.get("/:id/messages", patientAuthMiddleware, patientAuthCtrl.getPatientMessages);

module.exports = router;
