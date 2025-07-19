const express = require("express");
const {
  getRecycleBinItems,
  restoreItem,
  permanentlyDeleteItem,
  emptyRecycleBin,
  getRecycleBinStats
} = require("../controller/recycleBinController");
const { protectAdminRoute } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

// All recycle bin routes require admin authentication
router.use(protectAdminRoute);

// @route   GET /api/recycle-bin
// @desc    Get all deleted items in recycle bin
// @access  Private (Admin only)
router.get("/", getRecycleBinItems);

// @route   GET /api/recycle-bin/stats
// @desc    Get recycle bin statistics
// @access  Private (Admin only)
router.get("/stats", getRecycleBinStats);

// @route   PUT /api/recycle-bin/restore/:type/:id
// @desc    Restore a deleted item from recycle bin
// @access  Private (Admin only)
router.put("/restore/:type/:id", restoreItem);

// @route   DELETE /api/recycle-bin/permanent/:type/:id
// @desc    Permanently delete an item from recycle bin
// @access  Private (Admin only)
router.delete("/permanent/:type/:id", permanentlyDeleteItem);

// @route   DELETE /api/recycle-bin/empty
// @desc    Empty recycle bin (permanently delete all items)
// @access  Private (Admin only)
router.delete("/empty", emptyRecycleBin);

module.exports = router;