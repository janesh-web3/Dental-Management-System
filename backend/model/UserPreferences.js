const mongoose = require('mongoose');

const userPreferencesSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userType: {
    type: String,
    enum: ['admin', 'doctor', 'patient'],
    required: true
  },
  surpriseSettings: {
    animationsEnabled: {
      type: Boolean,
      default: true
    },
    soundsEnabled: {
      type: Boolean,
      default: true
    },
    confettiEnabled: {
      type: Boolean,
      default: true
    },
    playfulMessagesEnabled: {
      type: Boolean,
      default: true
    },
    reducedMotion: {
      type: Boolean,
      default: false
    }
  },
  soundSettings: {
    masterVolume: {
      type: Number,
      default: 0.3,
      min: 0,
      max: 1
    },
    clickSounds: {
      type: Boolean,
      default: true
    },
    notificationSounds: {
      type: Boolean,
      default: true
    },
    successSounds: {
      type: Boolean,
      default: true
    },
    errorSounds: {
      type: Boolean,
      default: true
    }
  },
  animationSettings: {
    buttonAnimations: {
      type: String,
      enum: ['bounce', 'pulse', 'scale', 'wobble', 'shake', 'glow', 'none'],
      default: 'bounce'
    },
    transitionSpeed: {
      type: String,
      enum: ['slow', 'normal', 'fast'],
      default: 'normal'
    },
    hoverEffects: {
      type: Boolean,
      default: true
    }
  },
  notificationSettings: {
    playfulLoadingMessages: {
      type: Boolean,
      default: true
    },
    celebrationMessages: {
      type: Boolean,
      default: true
    },
    encouragementMessages: {
      type: Boolean,
      default: true
    }
  },
  customization: {
    favoriteAnimations: [{
      type: String,
      enum: ['bounce', 'pulse', 'scale', 'wobble', 'shake', 'glow']
    }],
    preferredSounds: [{
      type: String,
      enum: ['click', 'success', 'notification', 'error', 'whoosh', 'pop', 'ding', 'confirm', 'celebrate']
    }],
    theme: {
      type: String,
      enum: ['default', 'playful', 'minimal', 'professional'],
      default: 'default'
    }
  },
  usage: {
    totalInteractions: {
      type: Number,
      default: 0
    },
    surprisesTriggered: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    favoriteFeatures: [String]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userPreferencesSchema.index({ userId: 1, userType: 1 });
userPreferencesSchema.index({ 'usage.lastActive': -1 });

// Update last active timestamp on save
userPreferencesSchema.pre('save', function(next) {
  this.usage.lastActive = new Date();
  next();
});

// Methods
userPreferencesSchema.methods.incrementInteractions = function() {
  this.usage.totalInteractions += 1;
  return this.save();
};

userPreferencesSchema.methods.incrementSurprises = function() {
  this.usage.surprisesTriggered += 1;
  return this.save();
};

userPreferencesSchema.methods.addFavoriteFeature = function(feature) {
  if (!this.usage.favoriteFeatures.includes(feature)) {
    this.usage.favoriteFeatures.push(feature);
    return this.save();
  }
  return this;
};

// Static methods
userPreferencesSchema.statics.getDefaultPreferences = function() {
  return {
    surpriseSettings: {
      animationsEnabled: true,
      soundsEnabled: true,
      confettiEnabled: true,
      playfulMessagesEnabled: true,
      reducedMotion: false
    },
    soundSettings: {
      masterVolume: 0.3,
      clickSounds: true,
      notificationSounds: true,
      successSounds: true,
      errorSounds: true
    },
    animationSettings: {
      buttonAnimations: 'bounce',
      transitionSpeed: 'normal',
      hoverEffects: true
    },
    notificationSettings: {
      playfulLoadingMessages: true,
      celebrationMessages: true,
      encouragementMessages: true
    },
    customization: {
      favoriteAnimations: [],
      preferredSounds: [],
      theme: 'default'
    }
  };
};

userPreferencesSchema.statics.findByUserId = function(userId, userType) {
  return this.findOne({ userId, userType });
};

userPreferencesSchema.statics.getOrCreatePreferences = async function(userId, userType) {
  let preferences = await this.findByUserId(userId, userType);
  
  if (!preferences) {
    const defaultPrefs = this.getDefaultPreferences();
    preferences = new this({
      userId,
      userType,
      ...defaultPrefs
    });
    await preferences.save();
  }
  
  return preferences;
};

module.exports = mongoose.model('UserPreferences', userPreferencesSchema);