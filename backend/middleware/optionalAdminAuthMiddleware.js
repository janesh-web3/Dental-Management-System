const jwt = require("jsonwebtoken");
const User = require("../model/User.js");

// Middleware for optional admin authentication
// This allows the route to be accessed with or without authentication
const optionalAdminAuth = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in the Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // If no token, continue without setting req.admin
    if (!token) {
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get admin from the token
      const admin = await User.findById(decoded.userId).select("-password");
      
      // If admin found, attach to request object
      if (admin) {
        req.admin = {
          id: admin._id,
          role: admin.role,
          name: admin.name,
          email: admin.email,
        };
      }
      
      next();
    } catch (error) {
      // Token invalid or expired, but still continue
      console.warn("Invalid token in optional auth:", error.message);
      next();
    }
  } catch (error) {
    console.error("Optional admin auth middleware error:", error);
    // Still continue even if there's an error
    next();
  }
};

module.exports = { optionalAdminAuth };
