const jwt = require("jsonwebtoken");

const generateToken = (id, role = "admin") => {
  // Use userId for admin tokens to match middleware expectations
  const payload = role === "admin" || role === "superadmin" 
    ? { userId: id, id: id, role: role } 
    : { id: id, role: role };
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

module.exports = { generateToken };
