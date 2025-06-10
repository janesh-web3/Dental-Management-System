const User = require("../model/User.js");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  // Check if authorization header exists
  if (!req.headers.authorization) {
    return res.status(401).json({ 
      success: false,
      message: "No authorization token provided" 
    });
  }

  try {
    // Extract token - handle both "Bearer token" and just "token" formats
    let token = req.headers.authorization;
    if (token.startsWith('Bearer ')) {
      token = token.slice(7); // Remove 'Bearer ' prefix
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid authorization token" 
      });
    }

    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Find the user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found or token is invalid" 
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: "Invalid token" 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: "Token expired" 
      });
    }
    
    // Generic error
    return res.status(401).json({ 
      success: false,
      message: "Authentication failed",
      error: error.message
    });
  }
};

module.exports = authMiddleware;
