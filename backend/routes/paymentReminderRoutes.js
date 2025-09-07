const express = require("express");
const router = express.Router();
const {
  startPaymentReminders,
  stopPaymentReminders,
  getPaymentReminderStatus,
  triggerPaymentReminderCheck,
  triggerRoleSpecificReminders
} = require("../controller/paymentReminderController");
const authMiddleware = require("../middleware/authMiddleware");
const { 
  adminOrSuperAdmin 
} = require("../middleware/rbacMiddleware");

// Payment reminder service management routes (admin/superadmin only)
router.post("/start", authMiddleware, adminOrSuperAdmin, startPaymentReminders);
router.post("/stop", authMiddleware, adminOrSuperAdmin, stopPaymentReminders);
router.get("/status", authMiddleware, adminOrSuperAdmin, getPaymentReminderStatus);
router.post("/trigger", authMiddleware, adminOrSuperAdmin, triggerPaymentReminderCheck);
router.post("/trigger-roles", authMiddleware, adminOrSuperAdmin, triggerRoleSpecificReminders);

module.exports = router;