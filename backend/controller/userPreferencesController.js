const UserPreferences = require('../model/UserPreferences');
const { validationResult } = require('express-validator');

// Get user preferences
const getUserPreferences = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    
    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and user type are required'
      });
    }

    const preferences = await UserPreferences.getOrCreatePreferences(userId, userType);
    
    res.status(200).json({
      success: true,
      data: preferences,
      message: 'User preferences retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user preferences',
      error: error.message
    });
  }
};

// Update user preferences
const updateUserPreferences = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, userType } = req.params;
    const updates = req.body;
    
    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and user type are required'
      });
    }

    let preferences = await UserPreferences.findByUserId(userId, userType);
    
    if (!preferences) {
      preferences = new UserPreferences({
        userId,
        userType,
        ...UserPreferences.getDefaultPreferences(),
        ...updates
      });
    } else {
      // Deep merge the updates
      Object.keys(updates).forEach(key => {
        if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
          preferences[key] = { ...preferences[key], ...updates[key] };
        } else {
          preferences[key] = updates[key];
        }
      });
    }

    await preferences.save();
    
    res.status(200).json({
      success: true,
      data: preferences,
      message: 'User preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user preferences',
      error: error.message
    });
  }
};

// Reset preferences to default
const resetPreferences = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    
    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and user type are required'
      });
    }

    const defaultPrefs = UserPreferences.getDefaultPreferences();
    
    let preferences = await UserPreferences.findByUserId(userId, userType);
    
    if (!preferences) {
      preferences = new UserPreferences({
        userId,
        userType,
        ...defaultPrefs
      });
    } else {
      Object.assign(preferences, defaultPrefs);
      preferences.usage.totalInteractions = 0;
      preferences.usage.surprisesTriggered = 0;
    }

    await preferences.save();
    
    res.status(200).json({
      success: true,
      data: preferences,
      message: 'User preferences reset to default successfully'
    });
  } catch (error) {
    console.error('Error resetting user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset user preferences',
      error: error.message
    });
  }
};

// Update specific setting
const updateSpecificSetting = async (req, res) => {
  try {
    const { userId, userType, category, setting } = req.params;
    const { value } = req.body;
    
    if (!userId || !userType || !category || !setting) {
      return res.status(400).json({
        success: false,
        message: 'All parameters are required'
      });
    }

    const preferences = await UserPreferences.getOrCreatePreferences(userId, userType);
    
    if (!preferences[category]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    preferences[category][setting] = value;
    await preferences.save();
    
    res.status(200).json({
      success: true,
      data: preferences,
      message: `${category}.${setting} updated successfully`
    });
  } catch (error) {
    console.error('Error updating specific setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting',
      error: error.message
    });
  }
};

// Track interaction
const trackInteraction = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    const { feature, surpriseTriggered = false } = req.body;
    
    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and user type are required'
      });
    }

    const preferences = await UserPreferences.getOrCreatePreferences(userId, userType);
    
    await preferences.incrementInteractions();
    
    if (surpriseTriggered) {
      await preferences.incrementSurprises();
    }
    
    if (feature) {
      await preferences.addFavoriteFeature(feature);
    }
    
    res.status(200).json({
      success: true,
      message: 'Interaction tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track interaction',
      error: error.message
    });
  }
};

// Get user analytics
const getUserAnalytics = async (req, res) => {
  try {
    const { userId, userType } = req.params;
    
    if (!userId || !userType) {
      return res.status(400).json({
        success: false,
        message: 'User ID and user type are required'
      });
    }

    const preferences = await UserPreferences.findByUserId(userId, userType);
    
    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'User preferences not found'
      });
    }

    const analytics = {
      totalInteractions: preferences.usage.totalInteractions,
      surprisesTriggered: preferences.usage.surprisesTriggered,
      favoriteFeatures: preferences.usage.favoriteFeatures,
      lastActive: preferences.usage.lastActive,
      engagementScore: preferences.usage.surprisesTriggered / Math.max(preferences.usage.totalInteractions, 1),
      preferredSettings: {
        animationsEnabled: preferences.surpriseSettings.animationsEnabled,
        soundsEnabled: preferences.surpriseSettings.soundsEnabled,
        preferredAnimation: preferences.animationSettings.buttonAnimations,
        masterVolume: preferences.soundSettings.masterVolume
      }
    };
    
    res.status(200).json({
      success: true,
      data: analytics,
      message: 'User analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user analytics',
      error: error.message
    });
  }
};

// Get all users preferences (admin only)
const getAllUsersPreferences = async (req, res) => {
  try {
    const { page = 1, limit = 50, userType } = req.query;
    
    const query = userType ? { userType } : {};
    
    const preferences = await UserPreferences.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'usage.lastActive': -1 });
    
    const total = await UserPreferences.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: preferences,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      message: 'All user preferences retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting all user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve all user preferences',
      error: error.message
    });
  }
};

module.exports = {
  getUserPreferences,
  updateUserPreferences,
  resetPreferences,
  updateSpecificSetting,
  trackInteraction,
  getUserAnalytics,
  getAllUsersPreferences
};