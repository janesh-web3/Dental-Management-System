const express = require("express");
const router = express.Router();
// Make sure the path is correct and the file exists
const prescriptionCtrl = require("../controller/prescriptionCtrl");

router.post("/create", prescriptionCtrl.createPrescription);

router.get("/all", prescriptionCtrl.getAllPrescriptions);

router.get("/patient/:patientId", prescriptionCtrl.getPatientPrescriptions);

router.get("/doctor/:doctorId", prescriptionCtrl.getDoctorPrescriptions);

router.get("/:id", prescriptionCtrl.getPrescriptionById);

router.put("/:id", prescriptionCtrl.updatePrescription);
router.delete("/:id", prescriptionCtrl.deletePrescription);

module.exports = router;
