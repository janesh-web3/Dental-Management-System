const Doctor = require("../model/Doctor.js");
const jwt = require("jsonwebtoken");

// Doctor login
const doctorLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
console.log(req.body)
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    // Find doctor by email
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check if doctor is active
    if (doctor.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Your account is currently inactive. Please contact the administrator."
      });
    }

    // Check if password is correct
    const isPasswordValid = await doctor.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: doctor._id, role: "doctor" },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "1d" }
    );

    // Remove password from response
    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.status(200).json({
      success: true,
      token,
      doctor: doctorResponse
    });
  } catch (error) {
    console.error("Doctor login error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message
    });
  }
};

// Get current doctor
const getCurrentDoctor = async (req, res) => {
  try {
    const doctorId = req.doctor.id;
    
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Remove password from response
    const doctorResponse = doctor.toObject();
    delete doctorResponse.password;

    res.status(200).json(doctorResponse);
  } catch (error) {
    console.error("Get current doctor error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching doctor details",
      error: error.message
    });
  }
};

module.exports = {
  doctorLogin,
  getCurrentDoctor
};
