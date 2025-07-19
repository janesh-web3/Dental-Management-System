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
      
      // Handle both userId and id fields in token
      const userId = decoded.userId || decoded.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Invalid token format",
        });
      }
      
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }
      
      // Check if the token is for an admin
      if (user.role !== "admin" && user.role !== "superadmin") {
        return res.status(403).json({
          success: false,
          message: "Not authorized as an admin",
        });
      }

      // Use the user we already found
      const admin = user;

      // Add admin to request object
      req.admin = {
        id: admin._id,
        role: admin.role || "admin",
        name: admin.name,
        email: admin.email,
      };
      
      // Also set req.user for compatibility
      req.user = admin;

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
