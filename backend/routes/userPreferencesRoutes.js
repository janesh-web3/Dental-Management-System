const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getUserPreferences,
  updateUserPreferences,
  resetPreferences,
  updateSpecificSetting,
  trackInteraction,
  getUserAnalytics,
  getAllUsersPreferences
} = require('../controller/userPreferencesController');

const { protect, authorize } = require('../middleware/adminAuth');
const authMiddleware = require('../middleware/authMiddleware');

// Validation middleware
const validatePreferencesUpdate = [
  body('surpriseSettings.animationsEnabled').optional().isBoolean(),
  body('surpriseSettings.soundsEnabled').optional().isBoolean(),
  body('surpriseSettings.confettiEnabled').optional().isBoolean(),
  body('surpriseSettings.playfulMessagesEnabled').optional().isBoolean(),
  body('surpriseSettings.reducedMotion').optional().isBoolean(),
  body('soundSettings.masterVolume').optional().isFloat({ min: 0, max: 1 }),
  body('soundSettings.clickSounds').optional().isBoolean(),
  body('soundSettings.notificationSounds').optional().isBoolean(),
  body('soundSettings.successSounds').optional().isBoolean(),
  body('soundSettings.errorSounds').optional().isBoolean(),
  body('animationSettings.buttonAnimations').optional().isIn(['bounce', 'pulse', 'scale', 'wobble', 'shake', 'glow', 'none']),
  body('animationSettings.transitionSpeed').optional().isIn(['slow', 'normal', 'fast']),
  body('animationSettings.hoverEffects').optional().isBoolean(),
  body('notificationSettings.playfulLoadingMessages').optional().isBoolean(),
  body('notificationSettings.celebrationMessages').optional().isBoolean(),
  body('notificationSettings.encouragementMessages').optional().isBoolean(),
  body('customization.theme').optional().isIn(['default', 'playful', 'minimal', 'professional'])
];

const validateSpecificSetting = [
  body('value').notEmpty().withMessage('Value is required')
];

const validateTrackInteraction = [
  body('feature').optional().isString(),
  body('surpriseTriggered').optional().isBoolean()
];

// Public routes (require authentication)
router.get('/:userType/:userId', authMiddleware, getUserPreferences);
router.put('/:userType/:userId', authMiddleware, validatePreferencesUpdate, updateUserPreferences);
router.post('/:userType/:userId/reset', authMiddleware, resetPreferences);
router.put('/:userType/:userId/:category/:setting', authMiddleware, validateSpecificSetting, updateSpecificSetting);
router.post('/:userType/:userId/track', authMiddleware, validateTrackInteraction, trackInteraction);
router.get('/:userType/:userId/analytics', authMiddleware, getUserAnalytics);

// Admin-only routes
router.get('/all/preferences', protect, authorize('admin'), getAllUsersPreferences);

// Bulk operations (admin only)
router.post('/bulk/reset', protect, authorize('admin'), async (req, res) => {
  try {
    const { userType, userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'User IDs array is required'
      });
    }

    const UserPreferences = require('../model/UserPreferences');
    const defaultPrefs = UserPreferences.getDefaultPreferences();
    
    const updatePromises = userIds.map(userId => {
      return UserPreferences.findOneAndUpdate(
        { userId, userType },
        { ...defaultPrefs, usage: { totalInteractions: 0, surprisesTriggered: 0, lastActive: new Date(), favoriteFeatures: [] } },
        { upsert: true, new: true }
      );
    });
    
    await Promise.all(updatePromises);
    
    res.status(200).json({
      success: true,
      message: `Bulk reset completed for ${userIds.length} users`
    });
  } catch (error) {
    console.error('Error in bulk reset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk reset',
      error: error.message
    });
  }
});

// Statistics endpoint (admin only)
router.get('/stats/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const UserPreferences = require('../model/UserPreferences');
    
    const stats = await UserPreferences.aggregate([
      {
        $group: {
          _id: '$userType',
          totalUsers: { $sum: 1 },
          averageInteractions: { $avg: '$usage.totalInteractions' },
          averageSurprises: { $avg: '$usage.surprisesTriggered' },
          soundsEnabledCount: { 
            $sum: { $cond: [{ $eq: ['$surpriseSettings.soundsEnabled', true] }, 1, 0] }
          },
          animationsEnabledCount: { 
            $sum: { $cond: [{ $eq: ['$surpriseSettings.animationsEnabled', true] }, 1, 0] }
          },
          confettiEnabledCount: { 
            $sum: { $cond: [{ $eq: ['$surpriseSettings.confettiEnabled', true] }, 1, 0] }
          }
        }
      }
    ]);
    
    const overallStats = await UserPreferences.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalInteractions: { $sum: '$usage.totalInteractions' },
          totalSurprises: { $sum: '$usage.surprisesTriggered' },
          averageEngagement: { 
            $avg: { 
              $divide: [
                '$usage.surprisesTriggered',
                { $max: ['$usage.totalInteractions', 1] }
              ]
            }
          }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        byUserType: stats,
        overall: overallStats[0] || {}
      },
      message: 'Statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
});

module.exports = router;