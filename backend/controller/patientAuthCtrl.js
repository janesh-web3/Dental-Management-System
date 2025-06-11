const Patient = require("../model/Patient");
const PatientAuth = require("../model/PatientAuth");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Appointment = require("../model/Appointment");

// Patient login controller
const patientLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Patient login attempt for email: ${email}`);

    // Validate input
    if (!email || !password) {
      console.log("Login failed: Email and password are required");
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find all patients with this email - since we now allow multiple patients with same email
    const patients = await Patient.find({
      "personalDetails.emailAddress": email,
    });

    if (patients.length === 0) {
      console.log(`Login failed: No patient found with email ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log(`Found ${patients.length} patients with email ${email}`);
    
    // Try to authenticate with each patient record
    let authenticatedPatient = null;
    let authenticatedPatientAuth = null;
    
    // First try to authenticate using Patient model passwords
    for (const patient of patients) {
      if (patient.password) {
        const isPasswordValid = await bcrypt.compare(password, patient.password);
        if (isPasswordValid) {
          console.log(`Password validation successful for patient ID: ${patient._id}`);
          authenticatedPatient = patient;
          
          // Look for existing PatientAuth record or create one
          let patientAuth = await PatientAuth.findOne({ patientId: patient._id });
          
          if (!patientAuth) {
            console.log("Creating new PatientAuth record for patient");
            patientAuth = new PatientAuth({
              email: patient.personalDetails.emailAddress,
              password: patient.password, // Already hashed
              patientId: patient._id,
            });
            await patientAuth.save();
            console.log(`Created PatientAuth with ID: ${patientAuth._id}`);
          } else {
            console.log(`Found existing PatientAuth with ID: ${patientAuth._id}`);
          }
          
          authenticatedPatientAuth = patientAuth;
          break;
        }
      }
    }
    
    // If no authentication yet, try PatientAuth records
    if (!authenticatedPatient) {
      console.log("No password match in Patient models, trying PatientAuth records");
      
      // Check all possible PatientAuth records for these patients
      for (const patient of patients) {
        const patientAuth = await PatientAuth.findOne({ patientId: patient._id });
        
        if (patientAuth) {
          const isPasswordValid = await patientAuth.comparePassword(password);
          if (isPasswordValid) {
            console.log(`Password validation successful with PatientAuth for patient ID: ${patient._id}`);
            authenticatedPatient = patient;
            authenticatedPatientAuth = patientAuth;
            break;
          }
        }
      }
    }
    
    // If still no authentication, return error
    if (!authenticatedPatient || !authenticatedPatientAuth) {
      console.log("Password validation failed for all patients with this email");
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login time
    authenticatedPatientAuth.lastLogin = new Date();
    await authenticatedPatientAuth.save();
    console.log("Updated last login time");

    // Generate JWT token
    const token = jwt.sign(
      { id: authenticatedPatientAuth._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    console.log(`Generated token for PatientAuth ID: ${authenticatedPatientAuth._id}`);

    // Return success with token and patient details
    res.status(200).json({
      success: true,
      token,
      patient: {
        _id: authenticatedPatient._id,
        name: authenticatedPatient.personalDetails.name,
        email: authenticatedPatient.personalDetails.emailAddress,
        contactNumber: authenticatedPatient.personalDetails.contactNumber,
        gender: authenticatedPatient.personalDetails.gender,
        address: authenticatedPatient.personalDetails.address,
        age: authenticatedPatient.personalDetails.age,
        role: "patient",
      },
    });
    console.log("Login successful, response sent");
  } catch (error) {
    console.error("Patient login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message,
    });
  }
};

// Get current patient details
const getCurrentPatient = async (req, res) => {
  try {
    // Patient is already attached to req by the middleware
    const patient = req.patient;

    // Return patient details
    res.status(200).json({
      _id: patient._id,
      name: patient.personalDetails.name,
      email: patient.personalDetails.emailAddress,
      contactNumber: patient.personalDetails.contactNumber,
      gender: patient.personalDetails.gender,
      address: patient.personalDetails.address,
      age: patient.personalDetails.age,
      role: "patient",
    });
  } catch (error) {
    console.error("Get current patient error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message,
    });
  }
};

// Update patient password
const updatePatientPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    // Get patient auth record
    const patientAuth = req.patientAuth;

    // Verify current password
    const isPasswordValid = await patientAuth.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    patientAuth.password = newPassword;
    await patientAuth.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update patient password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message,
    });
  }
};

// Get patient appointments
const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Validate that the requested patient ID matches the authenticated patient
    if (patientId !== req.patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to another patient's appointments",
      });
    }

    const patient = await Appointment.find({ patientId })
      .populate("doctor", "name specialization")
      .sort({ appointmentDate: 1 });

    res.status(200).json({
      success: true,
      appointments: patient || [],
    });
  } catch (error) {
    console.error("Get patient appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message,
    });
  }
};

// Get patient bills
const getPatientBills = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Validate that the requested patient ID matches the authenticated patient
    if (patientId !== req.patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to another patient's bills",
      });
    }

    // Find patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Extract billing information from medical details
    const bills = [];

    if (patient.medicalDetails && patient.medicalDetails.length > 0) {
      patient.medicalDetails.forEach((medicalDetail) => {
        if (
          medicalDetail.treatmentPlanning &&
          medicalDetail.treatmentPlanning.length > 0
        ) {
          medicalDetail.treatmentPlanning.forEach((plan) => {
            // For each treatment plan, create a bill record
            if (
              plan.selectedTeethDetails &&
              plan.selectedTeethDetails.length > 0
            ) {
              plan.selectedTeethDetails.forEach((tooth) => {
                if (tooth.dailyTreatments && tooth.dailyTreatments.length > 0) {
                  tooth.dailyTreatments.forEach((treatment) => {
                    bills.push({
                      _id: treatment._id,
                      date: treatment.date,
                      toothNumber: tooth.number,
                      procedure: treatment.procedure || tooth.procedure,
                      totalAmount: treatment.treatmentAmount || 0,
                      paidAmount: treatment.paidAmount || 0,
                      remainingAmount:
                        treatment.treatmentAmount - treatment.paidAmount || 0,
                      isCompleted: treatment.isCompleted,
                      doctorId: treatment.treatedByDoctor,
                      notes: treatment.notes,
                    });
                  });
                }
              });
            }
          });
        }
      });
    }

    // Sort bills by date (newest first)
    bills.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      bills,
    });
  } catch (error) {
    console.error("Get patient bills error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message,
    });
  }
};

// Get patient messages
const getPatientMessages = async (req, res) => {
  try {
    const patientId = req.params.id;

    // Validate that the requested patient ID matches the authenticated patient
    if (patientId !== req.patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to another patient's messages",
      });
    }

    // For now, return dummy messages
    // In a real implementation, you would fetch messages from a database
    const messages = [
      {
        _id: "msg1",
        sender: "doctor",
        senderDetails: {
          _id: "doc1",
          name: "Dr. Smith",
        },
        subject: "Appointment Confirmation",
        content:
          "Your appointment for dental cleaning has been confirmed for next Monday at 10:00 AM.",
        date: new Date(Date.now() - 86400000 * 2), // 2 days ago
        category: "appointment",
      },
      {
        _id: "msg2",
        sender: "admin",
        subject: "Payment Receipt",
        content:
          "Thank you for your recent payment of $150. Your receipt is attached.",
        date: new Date(Date.now() - 86400000 * 5), // 5 days ago
        category: "billing",
      },
      {
        _id: "msg3",
        sender: "doctor",
        senderDetails: {
          _id: "doc2",
          name: "Dr. Johnson",
        },
        subject: "Treatment Follow-up",
        content:
          "How are you feeling after your root canal procedure? Please let us know if you're experiencing any discomfort.",
        date: new Date(Date.now() - 86400000 * 7), // 7 days ago
        category: "treatment",
        relatedTo: "Root Canal Treatment",
      },
    ];

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get patient messages error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      details: error.message,
    });
  }
};

module.exports = {
  patientLogin,
  getCurrentPatient,
  updatePatientPassword,
  getPatientAppointments,
  getPatientBills,
  getPatientMessages,
};
