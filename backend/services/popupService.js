const Popup = require("../model/Popup.js");
const User = require("../model/User.js");

class PopupService {
  /**
   * Create a new popup notification
   */
  static async createPopup(popupData, createdBy) {
    try {
      const popup = new Popup({
        ...popupData,
        createdBy,
        startTime: new Date(popupData.startTime),
        endTime: popupData.endTime ? new Date(popupData.endTime) : null
      });

      await popup.save();
      await popup.populate('createdBy', 'name email');
      return popup;
    } catch (error) {
      throw new Error(`Failed to create popup: ${error.message}`);
    }
  }

  /**
   * Get popups with pagination and filtering
   */
  static async getPopups(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10 } = pagination;
      const { isActive, type, createdBy } = filters;

      let query = {};
      if (isActive !== undefined) query.isActive = isActive;
      if (type) query.type = type;
      if (createdBy) query.createdBy = createdBy;

      const popups = await Popup.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Popup.countDocuments(query);

      return {
        popups,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get popups: ${error.message}`);
    }
  }

  /**
   * Get active popups for a specific user based on role and timing
   */
  static async getActivePopupsForUser(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      return await Popup.getActivePopupsForUser(user.role, userId);
    } catch (error) {
      throw new Error(`Failed to get active popups for user: ${error.message}`);
    }
  }

  /**
   * Get a popup by ID with permission checking
   */
  static async getPopupById(popupId, userId) {
    try {
      const popup = await Popup.findById(popupId).populate('createdBy', 'name email');
      if (!popup) throw new Error('Popup not found');

      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Check if user has permission to view this popup
      if (user.role !== 'admin' && !popup.shouldDisplayForUser(user.role, userId)) {
        throw new Error('Access denied');
      }

      return popup;
    } catch (error) {
      throw new Error(`Failed to get popup: ${error.message}`);
    }
  }

  /**
   * Update popup
   */
  static async updatePopup(popupId, updateData) {
    try {
      const popup = await Popup.findById(popupId);
      if (!popup) throw new Error('Popup not found');

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
      return popup;
    } catch (error) {
      throw new Error(`Failed to update popup: ${error.message}`);
    }
  }

  /**
   * Delete popup
   */
  static async deletePopup(popupId) {
    try {
      const popup = await Popup.findByIdAndDelete(popupId);
      if (!popup) throw new Error('Popup not found');
      return popup;
    } catch (error) {
      throw new Error(`Failed to delete popup: ${error.message}`);
    }
  }

  /**
   * Toggle popup active status
   */
  static async togglePopupStatus(popupId) {
    try {
      const popup = await Popup.findById(popupId);
      if (!popup) throw new Error('Popup not found');

      popup.isActive = !popup.isActive;
      await popup.save();
      return popup;
    } catch (error) {
      throw new Error(`Failed to toggle popup status: ${error.message}`);
    }
  }

  /**
   * Mark popup as viewed by user
   */
  static async markAsViewed(popupId, userId) {
    try {
      const popup = await Popup.findById(popupId);
      if (!popup) throw new Error('Popup not found');

      await popup.markAsViewed(userId);
      return popup;
    } catch (error) {
      throw new Error(`Failed to mark popup as viewed: ${error.message}`);
    }
  }

  /**
   * Dismiss popup for user
   */
  static async dismissPopup(popupId, userId) {
    try {
      const popup = await Popup.findById(popupId);
      if (!popup) throw new Error('Popup not found');

      await popup.markAsDismissed(userId);
      return popup;
    } catch (error) {
      throw new Error(`Failed to dismiss popup: ${error.message}`);
    }
  }

  /**
   * Get popup analytics
   */
  static async getPopupAnalytics(popupId) {
    try {
      const popup = await Popup.findById(popupId)
        .populate('viewedBy.userId', 'name email role')
        .populate('dismissedBy.userId', 'name email role');

      if (!popup) throw new Error('Popup not found');

      const totalViews = popup.viewedBy.length;
      const totalDismissals = popup.dismissedBy.length;
      const totalInteractions = totalViews + totalDismissals;

      const analytics = {
        totalViews,
        totalDismissals,
        totalInteractions,
        viewRate: totalInteractions > 0 ? (totalViews / totalInteractions * 100).toFixed(2) : 0,
        dismissalRate: totalInteractions > 0 ? (totalDismissals / totalInteractions * 100).toFixed(2) : 0,
        engagementByRole: this._calculateEngagementByRole(popup),
        viewedBy: popup.viewedBy,
        dismissedBy: popup.dismissedBy,
        createdAt: popup.createdAt,
        isActive: popup.isActive
      };

      return analytics;
    } catch (error) {
      throw new Error(`Failed to get popup analytics: ${error.message}`);
    }
  }

  /**
   * Calculate engagement metrics by user role
   */
  static _calculateEngagementByRole(popup) {
    const roleEngagement = {};
    
    // Process views by role
    popup.viewedBy.forEach(view => {
      const role = view.userId.role;
      if (!roleEngagement[role]) {
        roleEngagement[role] = { views: 0, dismissals: 0 };
      }
      roleEngagement[role].views++;
    });

    // Process dismissals by role
    popup.dismissedBy.forEach(dismissal => {
      const role = dismissal.userId.role;
      if (!roleEngagement[role]) {
        roleEngagement[role] = { views: 0, dismissals: 0 };
      }
      roleEngagement[role].dismissals++;
    });

    // Calculate rates for each role
    Object.keys(roleEngagement).forEach(role => {
      const data = roleEngagement[role];
      const total = data.views + data.dismissals;
      data.total = total;
      data.viewRate = total > 0 ? (data.views / total * 100).toFixed(2) : 0;
      data.dismissalRate = total > 0 ? (data.dismissals / total * 100).toFixed(2) : 0;
    });

    return roleEngagement;
  }

  /**
   * Get popup statistics for dashboard
   */
  static async getPopupStats() {
    try {
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

      return {
        totalPopups,
        activePopups,
        inactivePopups: totalPopups - activePopups,
        recentPopups,
        popupsByType: popupsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      throw new Error(`Failed to get popup statistics: ${error.message}`);
    }
  }

  /**
   * Schedule popup reminders (for future implementation with cron jobs)
   */
  static async getPopupsForReminder() {
    try {
      const now = new Date();
      
      // Find popups that should send reminders
      const popups = await Popup.find({
        isActive: true,
        startTime: { $lte: now },
        $or: [
          { endTime: { $exists: false } },
          { endTime: null },
          { endTime: { $gte: now } }
        ],
        'reminderTime.value': { $exists: true, $ne: null }
      }).populate('createdBy', 'name email');

      return popups;
    } catch (error) {
      throw new Error(`Failed to get popups for reminder: ${error.message}`);
    }
  }

  /**
   * Clean up expired popups (for maintenance)
   */
  static async cleanupExpiredPopups() {
    try {
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

      // Deactivate popups that have expired and are older than a month
      const result = await Popup.updateMany(
        {
          endTime: { $lt: oneMonthAgo },
          isActive: true
        },
        {
          isActive: false
        }
      );

      return {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} expired popups deactivated`
      };
    } catch (error) {
      throw new Error(`Failed to cleanup expired popups: ${error.message}`);
    }
  }
}

module.exports = PopupService;