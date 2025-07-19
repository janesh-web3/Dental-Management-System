const express = require("express");
const router = express.Router();
const { 
  authenticateUser, 
  authorizePermission, 
  staffOrAdmin 
} = require("../middleware/rbacMiddleware");
const {
  addServicePayment,
  getServicePayments,
  getServicePaymentById,
  updateServicePayment,
  deleteServicePayment,
  getPatientServicePayments,
  getServicePaymentSummary,
} = require("../controller/servicePaymentController");

// Service payment routes with RBAC
router.post("/", authenticateUser, authorizePermission('payments', 'create'), addServicePayment);
router.get("/", authenticateUser, authorizePermission('payments', 'read'), getServicePayments);
router.get("/:id", authenticateUser, authorizePermission('payments', 'read'), getServicePaymentById);
router.put("/:id", authenticateUser, authorizePermission('payments', 'update'), updateServicePayment);
router.delete("/:id", authenticateUser, authorizePermission('payments', 'delete'), deleteServicePayment);
router.get("/patient/:patientId", authenticateUser, authorizePermission('payments', 'read'), getPatientServicePayments);

// Summary route requires staff or admin access
router.get("/summary", authenticateUser, staffOrAdmin, getServicePaymentSummary);

module.exports = router;