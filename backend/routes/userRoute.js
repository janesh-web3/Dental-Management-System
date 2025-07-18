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
  adminDashboard,
  staffDashboard,
  createUser,
  toggleUserStatus,
  changeUserRole,
} = require("../controller/userCtrl");
const authMiddleware = require("../middleware/authMiddleware");
const { 
  authenticateUser, 
  adminOnly, 
  staffOrAdmin, 
  dashboardAccess,
  selfOrAdmin 
} = require("../middleware/rbacMiddleware");
const User = require("../model/User");

// Migration route to update existing users with permissions
router.get("/migrate-users", async (req, res) => {
  try {
    const usersToUpdate = await User.find({
      $or: [
        { permissions: { $exists: false } },
        { permissions: null }
      ]
    });

    console.log(`Found ${usersToUpdate.length} users to update`);

    for (const user of usersToUpdate) {
      console.log(`Updating user: ${user.name} (${user.email}) - Role: ${user.role}`);
      
      // Set permissions based on role
      if (user.role === 'admin') {
        user.permissions = {
          dashboard: { fullAccess: true, basicAccess: true, analytics: true, reports: true },
          users: { create: true, read: true, update: true, delete: true },
          patients: { create: true, read: true, update: true, delete: true },
          doctors: { create: true, read: true, update: true, delete: true },
          appointments: { create: true, read: true, update: true, delete: true },
          income: { create: true, read: true, update: true, delete: true },
          expenses: { create: true, read: true, update: true, delete: true },
          contacts: { create: true, read: true, update: true, delete: true },
          settings: { access: true, configure: true },
        };
      } else {
        // Staff and other roles get limited permissions
        user.permissions = {
          dashboard: { fullAccess: false, basicAccess: true, analytics: false, reports: false },
          users: { create: false, read: false, update: false, delete: false },
          patients: { create: true, read: true, update: true, delete: false },
          doctors: { create: false, read: true, update: false, delete: false },
          appointments: { create: true, read: true, update: true, delete: false },
          income: { create: true, read: true, update: true, delete: false },
          expenses: { create: true, read: true, update: true, delete: false },
          contacts: { create: true, read: true, update: true, delete: false },
          settings: { access: false, configure: false },
        };
      }

      // Set default values for new fields
      if (user.isActive === undefined) {
        user.isActive = true;
      }
      
      if (!user.createdAt) {
        user.createdAt = new Date();
      }
      
      if (!user.updatedAt) {
        user.updatedAt = new Date();
      }

      // Save the user
      await user.save();
      console.log(`✓ Updated user: ${user.name}`);
    }

    return res.status(200).json({
      success: true,
      message: `Migration completed successfully! Updated ${usersToUpdate.length} users`,
      updatedUsers: usersToUpdate.length
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return res.status(500).json({
      success: false,
      message: "Migration failed",
      error: error.message
    });
  }
});

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

// Public routes
router.post("/login-user", loginUser);

// Protected routes - require authentication
router.get("/get-role", authenticateUser, getRole);

// Dashboard routes with role-based access
router.get("/dashboard", dashboard); // Legacy dashboard
router.get("/admin-dashboard", authenticateUser, adminOnly, adminDashboard);
router.get("/staff-dashboard", authenticateUser, staffOrAdmin, staffDashboard);

// User management routes (Admin only)
router.post("/create-user", authenticateUser, adminOnly, createUser);
router.get("/get-users", authenticateUser, adminOnly, getUsers);
router.put("/update-user/:id", authenticateUser, selfOrAdmin, updateUser);
router.delete("/delete-user/:id", authenticateUser, adminOnly, deleteUser);
router.patch("/toggle-status/:id", authenticateUser, adminOnly, toggleUserStatus);
router.patch("/change-role/:id", authenticateUser, adminOnly, changeUserRole);

// Test route to verify authentication
router.get("/test-auth", authenticateUser, (req, res) => {
  res.json({
    success: true,
    message: "Authentication working correctly",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      permissions: req.user.permissions
    }
  });
});

// Backward compatibility
router.post("/add-user", addUser);

module.exports = router;
