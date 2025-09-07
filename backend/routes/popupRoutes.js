const express = require("express");
const router = express.Router();
const {
  createPopup,
  getAllPopups,
  getActivePopupsForUser,
  getPopupById,
  updatePopup,
  deletePopup,
  togglePopupStatus,
  markAsViewed,
  dismissPopup,
  getPopupAnalytics,
  getPopupStats
} = require("../controller/popupController");
const authMiddleware = require("../middleware/authMiddleware");
const { 
  authenticateUser, 
  adminOnly,
  adminOrSuperAdmin 
} = require("../middleware/rbacMiddleware");

// Admin/Superadmin routes for popup management
router.post("/", authMiddleware, adminOrSuperAdmin, createPopup);
router.get("/all", authMiddleware, adminOrSuperAdmin, getAllPopups);
router.get("/:id", authMiddleware, getPopupById);
router.put("/:id", authMiddleware, adminOrSuperAdmin, updatePopup);
router.delete("/:id", authMiddleware, adminOrSuperAdmin, deletePopup);
router.patch("/:id/toggle-status", authMiddleware, adminOrSuperAdmin, togglePopupStatus);
router.get("/:id/analytics", authMiddleware, adminOrSuperAdmin, getPopupAnalytics);
router.get("/stats/dashboard", authMiddleware, adminOrSuperAdmin, getPopupStats);

// User routes for popup interaction
router.get("/active/user", authMiddleware, getActivePopupsForUser);
router.post("/:id/view", authMiddleware, markAsViewed);
router.post("/:id/dismiss", authMiddleware, dismissPopup);

module.exports = router;