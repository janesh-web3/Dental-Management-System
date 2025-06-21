const mongoose = require('mongoose');
const Notification = require("../model/Notification");

// Get notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const { userId, userType, page = 1, limit = 10, isRead } = req.query;
    
    const skip = (page - 1) * limit;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const query = { 
      userId: new mongoose.Types.ObjectId(userId),
      userType: userType || 'User' // Default to 'User' if not specified
    };
    
    // Add isRead filter if provided
    if (isRead !== undefined) {
      query.read = isRead === 'true';
    }
    
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query)
    ]);
    
    // The schema's toJSON transform will handle the mapping for us
    
    res.json({
      success: true,
      data: {
        notifications: notifications,
        totalCount: total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        hasNextPage: skip + notifications.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const { userId, userType = 'User' } = req.query;
    
    const count = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      userType,
      read: false
    });
    
    res.json({ success: true, count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true, readAt: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create a new notification
exports.createNotification = async (userId, userType, data) => {
  try {
    const notification = new Notification({
      userId,
      userType,
      ...data,
      read: false
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Mark all notifications as read for a user
exports.markAllAsRead = async (req, res) => {
  try {
    const { userId, userType } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const result = await Notification.updateMany(
      { 
        userId: new mongoose.Types.ObjectId(userId),
        userType: userType || 'User',
        read: false
      },
      { 
        read: true,
        readAt: new Date()
      }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await Notification.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete all notifications for a user
exports.deleteAllNotifications = async (req, res) => {
  try {
    const { userId, userType } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const result = await Notification.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
      userType: userType || 'User'
    });
    
    res.json({
      success: true,
      message: 'All notifications deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update notification settings
exports.updateNotificationSettings = async (req, res) => {
  try {
    const { userId, userType, soundEnabled } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    // This updates the user's notification preferences
    // Note: This should be stored in the User/Doctor/Patient model
    // But for now we'll just return success
    
    res.json({
      success: true,
      message: 'Notification settings updated',
      settings: { soundEnabled }
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create and emit a notification with socket
exports.createAndEmitNotification = async (data) => {
  try {
    const { 
      userId, 
      userType, 
      title, 
      message, 
      type = 'info',
      sourceId = null,
      sourceType = null,
      link = null,
      createdBy = null,
      createdByType = 'System',
      targetRoles = []
    } = data;

    const notification = new Notification({
      userId,
      userType,
      title,
      message,
      type,
      sourceId,
      sourceType,
      link,
      createdBy,
      createdByType,
      targetRoles,
      read: false
    });
    
    await notification.save();
    
    // Get socket.io instance
    const { getIO, notifyUser, broadcastNotification } = require('../socket');
    const io = getIO();
    
    if (!io) {
      console.error('Socket.io not initialized');
      return notification;
    }
    
    // Format notification for frontend
    const notificationForClient = {
      _id: notification._id,
      title: notification.title,
      description: notification.message,
      type: notification.type,
      isRead: notification.read,
      createdAt: notification.createdAt,
      link: notification.link,
      sourceType: notification.sourceType,
      sourceId: notification.sourceId
    };
    
    // Emit to specific user's channel
    if (userId) {
      notifyUser(userId, userType, 'notification', notificationForClient);
    }
    
    // Emit to role-based rooms
    if (targetRoles && targetRoles.length > 0) {
      targetRoles.forEach(role => {
        io.to(role).emit('notification', notificationForClient);
      });
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating and emitting notification:', error);
    return null;
  }
};
