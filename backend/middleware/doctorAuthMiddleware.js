const jwt = require("jsonwebtoken");
const Doctor = require("../model/Doctor.js");

// Middleware to protect doctor routes
const protectDoctorRoute = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in the Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token"
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

      // Handle both id and userId fields in token
      const doctorId = decoded.id || decoded.userId;
      if (!doctorId) {
        return res.status(401).json({
          success: false,
          message: "Invalid token format"
        });
      }

      // Check if the token is for a doctor
      if (decoded.role !== "doctor") {
        return res.status(403).json({
          success: false,
          message: "Not authorized as a doctor"
        });
      }

      // Get doctor from the token
      const doctor = await Doctor.findById(doctorId).select("-password");
      if (!doctor || doctor.isDeleted) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found"
        });
      }

      // Add doctor to request object
      req.doctor = {
        id: doctor._id,
        role: "doctor",
        name: doctor.name,
        email: doctor.email
      };
      
      // Also set req.user for compatibility
      req.user = doctor;

      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
        error: error.message
      });
    }
  } catch (error) {
    console.error("Doctor auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error in auth middleware",
      error: error.message
    });
  }
};

module.exports = { protectDoctorRoute };