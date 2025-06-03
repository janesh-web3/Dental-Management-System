const express = require("express");
const router = express.Router();
const { addAppointment, getAllAppointment, updateAppointmentStatus, updateAppointment } = require("../controller/appointmentCtrl.js");
const patientAuthMiddleware = require("../middleware/patientAuthMiddleware");

router.post("/add-appointment", addAppointment);
router.get("/appointment", getAllAppointment);
router.put("/update-appointment-status/:id", updateAppointmentStatus);

// New route for patients to update their appointments
router.put("/appointment/:id", patientAuthMiddleware, updateAppointment);

module.exports = router;