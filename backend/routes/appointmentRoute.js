const express = require("express");
const router = express.Router();
const { addAppointment, getAllAppointment, updateAppointmentStatus } = require("../controller/appointmentCtrl.js");

router.post("/add-appointment", addAppointment);
router.get("/appointment", getAllAppointment);
router.put("/update-appointment-status/:id", updateAppointmentStatus); 

module.exports = router;