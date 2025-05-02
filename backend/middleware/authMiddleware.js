const User = require("../model/User.js");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(403).json({ message: "Please login first" });
  }

  try {
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check in Admin collection first
    let user = await User.findById(decoded.userId);
    if (user) {
      req.user = user;
      return next();
    }

    return res.status(404).json({ message: "User not found" });
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = authMiddleware;
