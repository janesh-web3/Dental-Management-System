const jwt = require("jsonwebtoken");
const PatientAuth = require("../model/PatientAuth");
const Patient = require("../model/Patient");

// Middleware to verify patient JWT token and attach patient data to request
const patientAuthMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: `Token verification failed: ${tokenError.message}`,
      });
    }
    
    // Check if we have an ID in the token
    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format. Missing ID.",
      });
    }
    
    // Find patient auth by id
    const patientAuth = await PatientAuth.findById(decoded.id);
    if (!patientAuth) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Authentication failed.",
      });
    }
    
    
    
    // Find patient details
    const patient = await Patient.findById(patientAuth.patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found.",
      });
    }
    
    // Attach patient data to request
    req.patient = patient;
    req.patientAuth = patientAuth;
    
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token. Authentication failed.",
      });
    }
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }
    
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = patientAuthMiddleware;
