const Patient = require("../model/Patient");
const PatientAuth = require("../model/PatientAuth");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Patient login controller
const patientLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Patient login attempt for email: ${email}`);
    
    // Validate input
    if (!email || !password) {
      console.log('Login failed: Email and password are required');
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Check if patient exists with this email
    const patient = await Patient.findOne({
      "personalDetails.emailAddress": email
    });
    
    if (!patient) {
      console.log(`Login failed: No patient found with email ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log(`Patient found: ${patient._id}`);

    // First try to authenticate with the password in the Patient model
    // This handles patients created with the updated addPatient function
    if (patient.password) {
      const isPasswordValid = await bcrypt.compare(password, patient.password);
      
      if (isPasswordValid) {
        console.log('Password validation successful using Patient model');
        
        // Look for existing PatientAuth record or create one
        let patientAuth = await PatientAuth.findOne({ patientId: patient._id });
        
        if (!patientAuth) {
          console.log('Creating new PatientAuth record for patient');
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
        
        // Generate JWT token using PatientAuth ID for consistency
        const token = jwt.sign(
          { id: patientAuth._id },
          process.env.JWT_SECRET,
          { expiresIn: "30d" }
        );
        
        console.log(`Generated token for PatientAuth ID: ${patientAuth._id}`);

        // Return success with token and patient details
        return res.status(200).json({
          success: true,
          token,
          patient: {
            _id: patient._id,
            name: patient.personalDetails.name,
            email: patient.personalDetails.emailAddress,
            contactNumber: patient.personalDetails.contactNumber,
            gender: patient.personalDetails.gender,
            address: patient.personalDetails.address,
            age: patient.personalDetails.age,
            role: "patient",
          },
        });
      } else {
        console.log('Password validation failed using Patient model');
      }
    } else {
      console.log('No password field in Patient model, trying PatientAuth');
    }
    
    // Check if patient auth exists as a fallback
    console.log('Checking for PatientAuth record as fallback');
    let patientAuth = await PatientAuth.findOne({ patientId: patient._id });

    // If no auth record exists yet, create one
    if (!patientAuth) {
      console.log('No PatientAuth record found, creating one');
      // Helper function to generate a temporary password if needed
      const generateTempPassword = () => {
        return Math.random().toString(36).slice(-8);
      };
      
      // Create a new patient auth record
      patientAuth = new PatientAuth({
        email: patient.personalDetails.emailAddress,
        password: patient.password || generateTempPassword(), // Use existing password or generate a temp one
        patientId: patient._id,
      });
      await patientAuth.save();
      console.log(`Created new PatientAuth with ID: ${patientAuth._id}`);
    } else {
      console.log(`Found existing PatientAuth with ID: ${patientAuth._id}`);
    }

    // Verify password with PatientAuth model
    console.log('Verifying password with PatientAuth model');
    const isPasswordValid = await patientAuth.comparePassword(password);
    if (!isPasswordValid) {
      console.log('Password validation failed with PatientAuth model');
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log('Password validation successful with PatientAuth model');
    
    // Update last login time
    patientAuth.lastLogin = new Date();
    await patientAuth.save();
    console.log('Updated last login time');

    // Generate JWT token directly instead of using the model method
    // to ensure consistency with the middleware verification
    const token = jwt.sign(
      { id: patientAuth._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    console.log(`Generated token for PatientAuth ID: ${patientAuth._id}`);

    // Return success with token and patient details
    res.status(200).json({
      success: true,
      token,
      patient: {
        _id: patient._id,
        name: patient.personalDetails.name,
        email: patient.personalDetails.emailAddress,
        contactNumber: patient.personalDetails.contactNumber,
        gender: patient.personalDetails.gender,
        address: patient.personalDetails.address,
        age: patient.personalDetails.age,
        role: "patient",
      },
    });
    console.log('Login successful, response sent');
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

    // Find patient with populated appointments
    const patient = await Patient.findById(patientId).populate({
      path: "appointments",
      populate: {
        path: "doctorId",
        select: "name specialization",
      },
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      appointments: patient.appointments || [],
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
