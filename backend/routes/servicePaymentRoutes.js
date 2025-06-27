const express = require("express");
const router = express.Router();
const { protectAdminRoute } = require("../middleware/adminAuthMiddleware");
const { optionalAdminAuth } = require("../middleware/optionalAdminAuthMiddleware");
const {
  addServicePayment,
  getServicePayments,
  getServicePaymentById,
  updateServicePayment,
  deleteServicePayment,
  getPatientServicePayments,
  getServicePaymentSummary,
} = require("../controller/servicePaymentController");

// Routes that can work with or without authentication
router.post("/", optionalAdminAuth, addServicePayment);
router.get("/", optionalAdminAuth, getServicePayments);
router.get("/:id", optionalAdminAuth, getServicePaymentById);
router.put("/:id", optionalAdminAuth, updateServicePayment);
router.delete("/:id", optionalAdminAuth, deleteServicePayment);
router.get("/patient/:patientId", optionalAdminAuth, getPatientServicePayments);

// Routes that still require full admin authentication
router.get("/summary", protectAdminRoute, getServicePaymentSummary);

module.exports = router;