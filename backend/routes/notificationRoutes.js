const express = require('express');
const router = express.Router();
const notificationCtrl = require('../controller/notificationCtrl');

// Get notifications with pagination
router.get('/', notificationCtrl.getNotifications);

// Get unread notification count
router.get('/unread-count', notificationCtrl.getUnreadCount);

// Mark notification as read
router.patch('/:id/read', notificationCtrl.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', notificationCtrl.markAllAsRead);

// Delete a notification
router.delete('/:id', notificationCtrl.deleteNotification);

// Delete all notifications
router.delete('/delete-all', notificationCtrl.deleteAllNotifications);

// Update notification settings
router.patch('/settings', notificationCtrl.updateNotificationSettings);

module.exports = router;
