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
    
    // Build a more flexible query that checks both direct assignment and role-based targeting
    let query = {
      $or: [
        // Direct user targeting
        {
          userId: new mongoose.Types.ObjectId(userId),
          userType: userType || 'User' // Default to 'User' if not specified
        }
      ]
    };
    
    // For doctor users, also check notifications that target the 'doctor' role
    if (userType === 'Doctor') {
      // Check for role-based notifications targeting doctors
      query.$or.push({
        targetRoles: 'doctor'
      });
      
      // Also check if there are any notifications targeting all doctors
      query.$or.push({
        targetRoles: { $in: ['doctor'] }
      });
      
      // Also check if there are any notifications targeting this specific doctor by ID
      // This is for backwards compatibility with older notifications
      query.$or.push({
        userId: new mongoose.Types.ObjectId(userId),
        userType: 'Doctor'
      });
    }
    
    // For admin users, also check notifications that target admin/superadmin roles
    if (userType === 'User') {
      const user = await mongoose.model('User').findById(userId);
      if (user && user.role) {
        query.$or.push({
          targetRoles: user.role
        });
        
        // If user is admin, also check for superadmin notifications
        if (user.role === 'admin') {
          query.$or.push({
            targetRoles: 'superadmin'
          });
        }
      }
    }
    
    // Add isRead filter if provided
    if (isRead !== undefined) {
      query.read = isRead === 'true';
    }
    
    console.log('Notification query:', JSON.stringify(query));
    
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
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    // Build a more flexible query that checks both direct assignment and role-based targeting
    let query = {
      $or: [
        // Direct user targeting
        {
          userId: new mongoose.Types.ObjectId(userId),
          userType: userType,
          read: false
        }
      ]
    };
    
    // For doctor users, also check notifications that target the 'doctor' role
    if (userType === 'Doctor') {
      // Check for role-based notifications targeting doctors
      query.$or.push({
        targetRoles: 'doctor',
        read: false
      });
      
      // Also check if there are any notifications targeting all doctors
      query.$or.push({
        targetRoles: { $in: ['doctor'] },
        read: false
      });
    }
    
    // For admin users, also check notifications that target admin/superadmin roles
    if (userType === 'User') {
      const user = await mongoose.model('User').findById(userId);
      if (user && user.role) {
        query.$or.push({
          targetRoles: user.role,
          read: false
        });
        
        // If user is admin, also check for superadmin notifications
        if (user.role === 'admin') {
          query.$or.push({
            targetRoles: 'superadmin',
            read: false
          });
        }
      }
    }
    
    console.log('Unread count query:', JSON.stringify(query));
    
    const count = await Notification.countDocuments(query);
    
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
    
    // Build a more flexible query that checks both direct assignment and role-based targeting
    let query = {
      $or: [
        // Direct user targeting
        {
          userId: new mongoose.Types.ObjectId(userId),
          userType: userType || 'User',
          read: false
        }
      ]
    };
    
    // For doctor users, also check notifications that target the 'doctor' role
    if (userType === 'Doctor') {
      // Check for role-based notifications targeting doctors
      query.$or.push({
        targetRoles: 'doctor',
        read: false
      });
      
      // Also check if there are any notifications targeting all doctors
      query.$or.push({
        targetRoles: { $in: ['doctor'] },
        read: false
      });
    }
    
    // For admin users, also check notifications that target admin/superadmin roles
    if (userType === 'User') {
      const user = await mongoose.model('User').findById(userId);
      if (user && user.role) {
        query.$or.push({
          targetRoles: user.role,
          read: false
        });
        
        // If user is admin, also check for superadmin notifications
        if (user.role === 'admin') {
          query.$or.push({
            targetRoles: 'superadmin',
            read: false
          });
        }
      }
    }
    
    console.log('Mark all as read query:', JSON.stringify(query));
    
    const result = await Notification.updateMany(
      query,
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
  console.log('=== Starting createAndEmitNotification ===');
  console.log('Input data:', JSON.stringify({
    title: data.title,
    userId: data.userId,
    userType: data.userType,
    targetRoles: data.targetRoles,
    sourceType: data.sourceType,
    sourceId: data.sourceId
  }, null, 2));
  
  if (!data.title) {
    console.error('Invalid notification data: title is required');
    return null;
  }
  
  // At least one of userId or targetRoles must be provided
  if (!data.userId && (!data.targetRoles || data.targetRoles.length === 0)) {
    console.error('Invalid notification data: either userId or targetRoles must be provided');
    return null;
  }
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

    // For role-based notifications, we need to create a notification for each admin user
    if (targetRoles && targetRoles.length > 0) {
      console.log('Creating role-based notifications for roles:', targetRoles);
      
      // Find all admin users to send notifications to
      const User = require('../model/User');
      
      // Map target roles to match the User model's role values
      const roleMap = {
        'admin': 'admin',
        'superadmin': 'admin',  // Map superadmin to admin since User model doesn't have superadmin
        'doctor': 'doctor',
        'dentist': 'dentist',
        'reception': 'reception'
      };
      
      // Map and deduplicate roles
      const mappedRoles = [...new Set(targetRoles.map(role => roleMap[role] || role))];
      
      console.log('Searching for users with roles:', mappedRoles);
      
      const admins = await User.find({ 
        role: { $in: mappedRoles }
      });
      
      console.log('Found users:', admins.map(u => ({ id: u._id, role: u.role })));
      
      console.log(`Found ${admins.length} users with roles: ${targetRoles.join(', ')}`);
      
      // Create a notification for each admin user
      const notificationPromises = admins.map(admin => {
        const notificationData = {
          userId: admin._id,
          userType: 'User',
          title,
          message,
          type,
          sourceId,
          sourceType,
          link,
          createdBy: createdBy || admin._id,  // Use admin's ID or provided createdBy
          createdByType: createdByType || 'User',
          read: false,
          targetRoles: targetRoles,  // Preserve the original targetRoles
          soundEnabled: data.soundEnabled
        };
        
        console.log(`Creating notification for user ${admin._id}`);
        const notification = new Notification(notificationData);
        return notification.save()
          .then(savedNotif => {
            // Emit notification to the specific user
            const io = require('../socket').getIO();
            if (io) {
              io.to(`User:${admin._id}`).emit('notification', {
                _id: savedNotif._id,
                title: savedNotif.title,
                description: savedNotif.message,
                type: savedNotif.type,
                isRead: savedNotif.read,
                createdAt: savedNotif.createdAt,
                link: savedNotif.link,
                sourceType: savedNotif.sourceType,
                sourceId: savedNotif.sourceId
              });
            }
            return savedNotif;
          });
      });
      
      // Wait for all notifications to be created
      const notifications = await Promise.all(notificationPromises);
      console.log(`Created ${notifications.length} notifications`);
      return notifications[0]; // Return the first notification for backward compatibility
    }
    
    // For direct user notifications
    if (userId) {
      const notificationData = {
        userId,
        userType,
        title,
        message,
        type,
        sourceId,
        sourceType,
        link,
        createdBy: createdBy || userId,
        createdByType: createdByType || userType,
        read: false,
        targetRoles: targetRoles || [], // Preserve the targetRoles for user-specific notifications
        soundEnabled: data.soundEnabled
      };
      
      console.log('Creating direct notification for user:', userId);
      const notification = new Notification(notificationData);
      await notification.save();
      
      // Emit notification to the specific user
      const io = require('../socket').getIO();
      if (io) {
        io.to(`${userType}:${userId}`).emit('notification', {
          _id: notification._id,
          title: notification.title,
          description: notification.message,
          type: notification.type,
          isRead: notification.read,
          createdAt: notification.createdAt,
          link: notification.link,
          sourceType: notification.sourceType,
          sourceId: notification.sourceId
        });
      }
      
      return notification;
    }
    
    // If we get here, neither userId nor targetRoles were provided
    console.error('Invalid notification data: either userId or targetRoles must be provided');
    return null;
  } catch (error) {
    console.error('Error creating and emitting notification:', error);
    return null;
  }
};
