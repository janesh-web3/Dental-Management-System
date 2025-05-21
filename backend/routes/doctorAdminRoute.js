const express = require("express");
const router = express.Router();
const {
  getDashboardOverview,
  getDoctorAppointments,
  createDoctorAppointment,
  updateDoctorAppointment,
  cancelDoctorAppointment,
  getDoctorPatients,
  getPatientDetails,
  createTreatmentPlan,
  updateTreatmentPlan,
  updateTreatmentStep,
  createPrescription,
  getDoctorPrescriptions,
  getDoctorInvoices,
  getDoctorAnalytics,
  updateDoctorProfile,
  updateDoctorAvailability,
  getDoctorNotifications
} = require("../controller/doctorAdminCtrl.js");
const { upload } = require("../middleware/multer.js");
const { protectDoctorRoute } = require("../middleware/doctorAuthMiddleware.js");

// Apply doctor authentication middleware to all routes
router.use(protectDoctorRoute);

// Dashboard Overview
router.get("/dashboard/:doctorId", getDashboardOverview);

// Appointments Module
router.get("/appointments/:doctorId", getDoctorAppointments);
router.post("/appointments/:doctorId", createDoctorAppointment);
router.put("/appointments/:doctorId/:appointmentId", updateDoctorAppointment);
router.put("/appointments/:doctorId/:appointmentId/cancel", cancelDoctorAppointment);

// Patients Management
router.get("/patients/:doctorId", getDoctorPatients);
router.get("/patients/:doctorId/:patientId", getPatientDetails);

// Treatment Management
router.post("/treatments/:doctorId", createTreatmentPlan);
router.put("/treatments/:doctorId/:treatmentId", updateTreatmentPlan);
router.put("/treatments/:doctorId/:treatmentId/steps/:stepId", updateTreatmentStep);

// Prescription Management
router.post("/prescriptions/:doctorId", createPrescription);
router.get("/prescriptions/:doctorId", getDoctorPrescriptions);

// Billing Overview
router.get("/invoices/:doctorId", getDoctorInvoices);

// Reports & Analytics
router.get("/analytics/:doctorId", getDoctorAnalytics);

// Doctor Profile and Availability
router.put("/profile/:doctorId", upload.single('image'), updateDoctorProfile);
router.put("/availability/:doctorId", updateDoctorAvailability);

// Notifications & Reminders
router.get("/notifications/:doctorId", getDoctorNotifications);

// Add route validation middleware to ensure the doctor can only access their own data
router.param('doctorId', (req, res, next, doctorId) => {
  // Check if the authenticated doctor is trying to access their own data
  if (req.doctor && req.doctor.id.toString() !== doctorId) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to access this resource"
    });
  }
  next();
});

module.exports = router;
