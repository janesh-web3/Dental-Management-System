const jwt = require("jsonwebtoken");
const User = require("../model/User.js");

// Middleware to protect admin routes
const protectAdminRoute = async (req, res, next) => {
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
        message: "Not authorized, no token",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      // Check if the token is for an admin
      if (user.role !== "admin" && user.role !== "superadmin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized as an admin",
        });
      }

      // Get admin from the token
      const admin = await User.findById(decoded.userId).select("-password");
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Add admin to request object
      req.admin = {
        id: admin._id,
        role: "admin",
        name: admin.name,
        email: admin.email,
      };

      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Server error in auth middleware",
      error: error.message,
    });
  }
};

module.exports = { protectAdminRoute };
