const { getIO, notifyAdmins } = require('../socket');
const notificationCtrl = require('../controller/notificationCtrl');

/**
 * Send a notification via socket and save to database
 * @param {Object} params Notification parameters
 * @param {string} params.title Notification title
 * @param {string} params.message Notification message
 * @param {string} params.type Notification type (info, success, warning, error)
 * @param {string} params.userId Recipient user ID
 * @param {string} params.userType Recipient user type (User, Doctor, Patient)
 * @param {Object} [params.data] Additional notification data
 * @param {boolean} [params.saveToDatabase=true] Whether to save the notification to the database
 */
exports.sendNotification = async (params) => {
  try {
    // Validate required fields
    if (!params.title || !params.message || !params.userId || !params.userType) {
      console.error('Missing required notification fields:', params);
      return null;
    }

    // Set default type if not provided
    const type = params.type || 'info';

    // Prepare notification data
    const notificationData = {
      title: params.title,
      message: params.message,
      type,
      data: params.data || {}
    };

    // Save to database if requested (default true)
    let dbNotification = null;
    if (params.saveToDatabase !== false) {
      dbNotification = await notificationCtrl.createNotification(
        params.userId,
        params.userType,
        notificationData
      );
    }    // Send via socket
    const io = getIO();
    
    // Map to frontend format
    const socketNotification = {
      _id: dbNotification ? dbNotification._id : Date.now().toString(),
      title: params.title,
      description: params.message,
      type,
      isRead: false,
      receiver: params.userId,
      receiverModel: params.userType,
      createdBy: params.data?.createdBy || null,
      createdByModel: params.data?.createdByModel || 'System',
      additionalData: params.data,
      createdAt: new Date().toISOString()
    };

    // Send to specific user channel
    notifyUser(params.userId, params.userType, 'notification', socketNotification);
    
    // Also emit to general event channels for listeners
    if (params.eventType) {
      broadcastNotification(params.eventType, socketNotification);
    }

    return dbNotification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
};

/**
 * Send a notification to all users with a specific role
 * @param {Object} params Notification parameters
 * @param {string} params.title Notification title
 * @param {string} params.message Notification message
 * @param {string} params.type Notification type (info, success, warning, error)
 * @param {string[]} params.targetRoles Array of roles to notify (admin, doctor, patient)
 * @param {Object} [params.data] Additional notification data
 */
exports.sendRoleNotification = async (params) => {
  try {
    if (!params.title || !params.message || !params.targetRoles || !Array.isArray(params.targetRoles)) {
      console.error('Missing required role notification fields:', params);
      return false;
    }

    // Set default type if not provided
    const type = params.type || 'info';    // Get socket io instance
    const io = getIO();
    
    // Prepare notification
    const notification = {
      title: params.title,
      description: params.message,
      type,
      isRead: false,
      createdBy: params.data?.createdBy || null,
      createdByModel: params.data?.createdByModel || 'System',
      additionalData: params.data,
      createdAt: new Date().toISOString()
    };

    // Send to each role
    params.targetRoles.forEach(role => {
      io.to(role).emit('notification', notification);
    });    // Emit event type if provided
    if (params.eventType) {
      io.emit(params.eventType, notification);
    }

    return true;
  } catch (error) {
    console.error('Error sending role notification:', error);
    return false;
  }
};
