const express = require("express");
const { getPatientById } = require("../controller/patientCtrl");

const router = express.Router();

// Public route to get patient details by ID (for QR code scanning)
router.get("/public/:id", getPatientById);

module.exports = router;
