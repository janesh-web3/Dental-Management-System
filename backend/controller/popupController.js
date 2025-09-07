const Popup = require("../model/Popup.js");
const User = require("../model/User.js");
const { notifyPopup } = require('../socket');

// Create a new popup (superadmin only)
const createPopup = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      rolesVisibleTo,
      startTime,
      endTime,
      reminderTime,
      displayType,
      actions
    } = req.body;

    // Check if user is superadmin/admin
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only superadmin/admin can create popups."
      });
    }

    // Validate required fields
    if (!title || !message || !startTime || !rolesVisibleTo?.length) {
      return res.status(400).json({
        success: false,
        message: "Title, message, start time, and visible roles are required."
      });
    }

    // Create new popup
    const newPopup = new Popup({
      title,
      message,
      type: type || "Notice",
      rolesVisibleTo,
      createdBy: req.user.id,
      startTime: new Date(startTime),
      endTime: endTime ? new Date(endTime) : null,
      reminderTime,
      displayType: displayType || "Modal",
      actions: actions || [{ label: "Dismiss", action: "close" }]
    });

    await newPopup.save();
    await newPopup.populate('createdBy', 'name email');

    // Emit real-time popup notification
    try {
      notifyPopup(newPopup, rolesVisibleTo);
    } catch (socketError) {
      console.error('⚠️ Failed to emit real-time popup notification:', socketError);
    }

    res.status(201).json({
      success: true,
      message: "Popup created successfully!",
      data: newPopup
    });

  } catch (error) {
    console.error("Create popup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get all popups (admin only)
const getAllPopups = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/superadmin can view all popups."
      });
    }

    const { page = 1, limit = 10, isActive, type } = req.query;
    
    let filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (type) {
      filter.type = type;
    }

    const popups = await Popup.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Popup.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: popups,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error("Get all popups error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get active popups for current user
const getActivePopupsForUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const popups = await Popup.getActivePopupsForUser(user.role, req.user.id);

    res.status(200).json({
      success: true,
      data: popups
    });

  } catch (error) {
    console.error("Get active popups error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get popup by ID
const getPopupById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const popup = await Popup.findById(id).populate('createdBy', 'name email');
    
    if (!popup) {
      return res.status(404).json({
        success: false,
        message: "Popup not found"
      });
    }

    // Check permissions - admin/superadmin can see all, others can only see popups visible to their role
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin' && user.role !== 'superadmin' && !popup.shouldDisplayForUser(user.role, req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    res.status(200).json({
      success: true,
      data: popup
    });

  } catch (error) {
    console.error("Get popup by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Update popup (admin only)
const updatePopup = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if user is admin/superadmin
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/superadmin can update popups."
      });
    }

    const popup = await Popup.findById(id);
    if (!popup) {
      return res.status(404).json({
        success: false,
        message: "Popup not found"
      });
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (key === 'startTime' || key === 'endTime') {
        popup[key] = updateData[key] ? new Date(updateData[key]) : null;
      } else {
        popup[key] = updateData[key];
      }
    });

    await popup.save();
    await popup.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: "Popup updated successfully!",
      data: popup
    });

  } catch (error) {
    console.error("Update popup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Delete popup (admin only)
const deletePopup = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin/superadmin
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/superadmin can delete popups."
      });
    }

    const popup = await Popup.findByIdAndDelete(id);
    if (!popup) {
      return res.status(404).json({
        success: false,
        message: "Popup not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Popup deleted successfully!"
    });

  } catch (error) {
    console.error("Delete popup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Toggle popup active status (admin only)
const togglePopupStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin/superadmin
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/superadmin can toggle popup status."
      });
    }

    const popup = await Popup.findById(id);
    if (!popup) {
      return res.status(404).json({
        success: false,
        message: "Popup not found"
      });
    }

    popup.isActive = !popup.isActive;
    await popup.save();

    res.status(200).json({
      success: true,
      message: `Popup ${popup.isActive ? 'activated' : 'deactivated'} successfully!`,
      data: { isActive: popup.isActive }
    });

  } catch (error) {
    console.error("Toggle popup status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Mark popup as viewed by user
const markAsViewed = async (req, res) => {
  try {
    const { id } = req.params;

    const popup = await Popup.findById(id);
    if (!popup) {
      return res.status(404).json({
        success: false,
        message: "Popup not found"
      });
    }

    await popup.markAsViewed(req.user.id);

    res.status(200).json({
      success: true,
      message: "Popup marked as viewed"
    });

  } catch (error) {
    console.error("Mark as viewed error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Dismiss popup for user
const dismissPopup = async (req, res) => {
  try {
    const { id } = req.params;

    const popup = await Popup.findById(id);
    if (!popup) {
      return res.status(404).json({
        success: false,
        message: "Popup not found"
      });
    }

    await popup.markAsDismissed(req.user.id);

    res.status(200).json({
      success: true,
      message: "Popup dismissed successfully"
    });

  } catch (error) {
    console.error("Dismiss popup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get popup analytics (admin only)
const getPopupAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/superadmin can view analytics."
      });
    }

    const { id } = req.params;
    const popup = await Popup.findById(id)
      .populate('viewedBy.userId', 'name email role')
      .populate('dismissedBy.userId', 'name email role');

    if (!popup) {
      return res.status(404).json({
        success: false,
        message: "Popup not found"
      });
    }

    const analytics = {
      totalViews: popup.viewedBy.length,
      totalDismissals: popup.dismissedBy.length,
      viewRate: popup.viewedBy.length > 0 ? (popup.viewedBy.length / (popup.viewedBy.length + popup.dismissedBy.length) * 100).toFixed(2) : 0,
      dismissalRate: popup.dismissedBy.length > 0 ? (popup.dismissedBy.length / (popup.viewedBy.length + popup.dismissedBy.length) * 100).toFixed(2) : 0,
      viewedBy: popup.viewedBy,
      dismissedBy: popup.dismissedBy
    };

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error("Get popup analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// Get popup statistics for dashboard (admin/superadmin only)
const getPopupStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admin/superadmin can view stats."
      });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const [
      totalPopups,
      activePopups,
      recentPopups,
      popupsByType
    ] = await Promise.all([
      Popup.countDocuments(),
      Popup.countDocuments({ isActive: true }),
      Popup.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Popup.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 } } }
      ])
    ]);

    const stats = {
      totalPopups,
      activePopups,
      inactivePopups: totalPopups - activePopups,
      recentPopups,
      popupsByType: popupsByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("Get popup stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

module.exports = {
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
};