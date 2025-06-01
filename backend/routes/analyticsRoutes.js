const express = require("express");
const router = express.Router();
const { 
  getAppointmentAnalytics, 
  getRevenueAnalytics, 
  getDoctorPerformanceAnalytics, 
  getPatientInsightsAnalytics 
} = require("../controller/analyticsController");
const { protectAdminRoute } = require("../middleware/adminAuthMiddleware");

// All routes are protected with admin middleware
router.use(protectAdminRoute);

// Analytics routes
router.get("/appointments", getAppointmentAnalytics);
router.get("/revenue", getRevenueAnalytics);
router.get("/doctors", getDoctorPerformanceAnalytics);
router.get("/patients", getPatientInsightsAnalytics);

module.exports = router;
