const express = require('express');
const router = express.Router();
const notificationCtrl = require('../controller/notificationCtrl');
const { authenticateUser } = require("../middleware/rbacMiddleware");

// Get notifications with pagination (require authentication)
router.get('/', authenticateUser, notificationCtrl.getNotifications);

// Get unread notification count (require authentication)
router.get('/unread-count', authenticateUser, notificationCtrl.getUnreadCount);

// Mark notification as read (require authentication)
router.patch('/:id/read', authenticateUser, notificationCtrl.markAsRead);

// Mark all notifications as read (require authentication)
router.patch('/mark-all-read', authenticateUser, notificationCtrl.markAllAsRead);

// Delete a notification (require authentication)
router.delete('/:id', authenticateUser, notificationCtrl.deleteNotification);

// Delete all notifications (require authentication)
router.delete('/delete-all', authenticateUser, notificationCtrl.deleteAllNotifications);

// Update notification settings (require authentication)
router.patch('/settings', authenticateUser, notificationCtrl.updateNotificationSettings);

module.exports = router;
