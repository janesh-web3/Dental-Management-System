const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const {
  addUser,
  loginUser,
  dashboard,
  getRole,
  updateUser,
  deleteUser,
  getUsers,
} = require("../controller/userCtrl");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../model/User");

// Add a route to ensure at least one dentist user exists
router.get("/ensure-dentist-exists", async (req, res) => {
  try {
    // Count existing dentist users
    const count = await User.countDocuments({ role: "dentist" });
    
    if (count === 0) {
      // No dentist users exist, create a sample dentist
      const hashedPassword = await bcrypt.hash("password123", 10);
      const sampleDentist = new User({
        name: "Dr. Jane Smith",
        email: "dr.jane@example.com",
        password: hashedPassword, 
        role: "dentist",
        contact: "9876543210"
      });
      
      await sampleDentist.save();
      console.log("Created sample dentist user:", sampleDentist);
      
      return res.status(201).json({
        success: true,
        message: "Sample dentist user created",
        data: { ...sampleDentist.toObject(), password: undefined }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: `${count} dentist users already exist in the system`,
      count
    });
  } catch (error) {
    console.error("Error ensuring dentist user exists:", error);
    return res.status(500).json({
      success: false,
      message: "Error checking/creating sample dentist user",
      error: error.message
    });
  }
});

router.post("/add-user", addUser);
router.post("/login-user", loginUser);
router.post("/auth-user", loginUser); // Alternative endpoint to bypass ad blockers
router.get("/dashboard", dashboard);
router.get("/get-role", authMiddleware, getRole);
router.put("/update-user/:id", updateUser);
router.delete("/delete-user/:id", deleteUser);
router.get("/get-users", authMiddleware, getUsers);

module.exports = router;
