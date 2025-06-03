const express = require("express");
const router = express.Router();
const Patient = require("../model/Patient");
const PatientAuth = require("../model/PatientAuth");
const patientAuthMiddleware = require("../middleware/patientAuthMiddleware");
const Appointment = require("../model/Appointment");
const Prescription = require("../model/Prescription");

// Patient login route
router.post("/patient/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find patient auth by email
    const patientAuth = await PatientAuth.findOne({ email });
    if (!patientAuth) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isMatch = await patientAuth.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Find patient details
    const patient = await Patient.findById(patientAuth.patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Generate token
    const token = patientAuth.generateAuthToken();

    // Update last login
    patientAuth.lastLogin = new Date();
    await patientAuth.save();

    // Return success with token and patient data
    return res.status(200).json({
      success: true,
      token,
      patient: {
        _id: patient._id,
        name: patient.personalDetails.name,
        email: patientAuth.email,
        contactNumber: patient.personalDetails.contactNumber,
        gender: patient.personalDetails.gender,
        address: patient.personalDetails.address,
        age: patient.personalDetails.age,
      },
    });
  } catch (error) {
    console.error("Patient login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get current patient (protected route)
router.get("/patient/me", patientAuthMiddleware, async (req, res) => {
  try {
    const patient = req.patient;
    const patientAuth = req.patientAuth;

    return res.status(200).json({
      _id: patient._id,
      name: patient.personalDetails.name,
      email: patientAuth.email,
      contactNumber: patient.personalDetails.contactNumber,
      gender: patient.personalDetails.gender,
      address: patient.personalDetails.address,
      age: patient.personalDetails.age,
      role: "patient",
    });
  } catch (error) {
    console.error("Get current patient error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get patient appointments (protected route)
router.get("/patient/:id/appointments", patientAuthMiddleware, async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Verify the patient is requesting their own data
    if (req.patient._id.toString() !== patientId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to patient data",
      });
    }

    // Find appointments for this patient
    const appointments = await Appointment.find({ patientId })
      .populate("doctor", "name specialization")
      .sort({ appointmentDate: 1 });

    return res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Get patient appointments error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get patient bills (protected route)
router.get("/patient/:id/bills", patientAuthMiddleware, async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Verify the patient is requesting their own data
    if (req.patient._id.toString() !== patientId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to patient data",
      });
    }

    // Get patient with treatment planning data
    const patient = await Patient.findById(patientId);
    
    // Extract billing information from treatment planning
    const bills = [];
    
    if (patient && patient.medicalDetails && patient.medicalDetails.length > 0) {
      patient.medicalDetails.forEach(detail => {
        if (detail.treatmentPlanning && detail.treatmentPlanning.length > 0) {
          detail.treatmentPlanning.forEach(plan => {
            // Create a bill object from treatment plan
            bills.push({
              date: plan.treatmentDate,
              totalAmount: plan.totalPlanAmount,
              paidAmount: plan.totalPaidAmount,
              remainingAmount: plan.totalRemainingAmount,
              isCompleted: plan.isCompleted,
              treatments: plan.selectedTeethDetails.map(tooth => ({
                toothNumber: tooth.number,
                procedure: tooth.procedure,
                amount: tooth.totalTreatmentAmount,
                paid: tooth.totalPaidAmount,
                remaining: tooth.totalRemainingAmount,
                isCompleted: tooth.isCompleted
              }))
            });
          });
        }
      });
    }

    return res.status(200).json({
      success: true,
      bills,
    });
  } catch (error) {
    console.error("Get patient bills error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get patient messages/prescriptions (protected route)
router.get("/patient/:id/messages", patientAuthMiddleware, async (req, res) => {
  try {
    const patientId = req.params.id;
    
    // Verify the patient is requesting their own data
    if (req.patient._id.toString() !== patientId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to patient data",
      });
    }

    // Find prescriptions for this patient
    const prescriptions = await Prescription.find({ patientId })
      .populate("doctorId", "name specialization")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      messages: prescriptions.map(p => ({
        id: p._id,
        date: p.createdAt,
        doctorName: p.doctorId ? p.doctorId.name : "Unknown Doctor",
        doctorSpecialization: p.doctorId ? p.doctorId.specialization : "",
        title: "Prescription",
        content: p.notes || "New prescription available",
        isRead: false, // This could be enhanced with a read status feature
        type: "prescription"
      })),
    });
  } catch (error) {
    console.error("Get patient messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
