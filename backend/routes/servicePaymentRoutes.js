const express = require("express");
const router = express.Router();
const { protectAdminRoute } = require("../middleware/adminAuthMiddleware");
const {
  addServicePayment,
  getServicePayments,
  getServicePaymentById,
  updateServicePayment,
  deleteServicePayment,
  getPatientServicePayments,
  getServicePaymentSummary,
} = require("../controller/servicePaymentController");

// Protected routes - require admin authentication
router.use(protectAdminRoute);

// Service payment routes
router.post("/", addServicePayment);
router.get("/", getServicePayments);
router.get("/summary", getServicePaymentSummary);
router.get("/:id", getServicePaymentById);
router.put("/:id", updateServicePayment);
router.delete("/:id", deleteServicePayment);

// Patient-specific service payments
router.get("/patient/:patientId", getPatientServicePayments);

module.exports = router; 