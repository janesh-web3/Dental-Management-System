const mongoose = require("mongoose");

const popupSchema = new mongoose.Schema({
  popupId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'popup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  },
  title: {
    type: String,
    required: [true, "Title is required!"],
    minLength: [3, "Title must contain at least 3 characters!"],
    maxLength: [100, "Title cannot exceed 100 characters!"]
  },
  message: {
    type: String,
    required: [true, "Message is required!"],
    minLength: [10, "Message must contain at least 10 characters!"],
    maxLength: [1000, "Message cannot exceed 1000 characters!"]
  },
  type: {
    type: String,
    enum: ["Notice", "Event", "Payment Reminder", "Alert"],
    default: "Notice",
    required: true
  },
  rolesVisibleTo: [{
    type: String,
    enum: ["superadmin", "admin", "staff", "dentist", "doctor", "reception", "All"],
    required: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startTime: {
    type: Date,
    required: [true, "Start time is required!"]
  },
  endTime: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > this.startTime;
      },
      message: "End time must be after start time"
    }
  },
  reminderTime: {
    value: {
      type: Number,
      min: [1, "Reminder time value must be at least 1"]
    },
    unit: {
      type: String,
      enum: ["minutes", "hours", "days"],
      default: "hours"
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayType: {
    type: String,
    enum: ["Modal", "Banner", "Toast", "FullScreen"],
    default: "Modal",
    required: true
  },
  actions: [{
    label: {
      type: String,
      required: true,
      maxLength: [50, "Action label cannot exceed 50 characters"]
    },
    action: {
      type: String,
      enum: ["close", "redirect", "custom"],
      required: true
    },
    url: {
      type: String,
      validate: {
        validator: function(value) {
          return this.action !== 'redirect' || (value && value.length > 0);
        },
        message: "URL is required when action is 'redirect'"
      }
    },
    customAction: String
  }],
  dismissedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    dismissedAt: {
      type: Date,
      default: Date.now
    }
  }],
  viewedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt field
popupSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// Instance method to check if popup should be displayed for a user
popupSchema.methods.shouldDisplayForUser = function(userRole, userId) {
  // Check if popup is active
  if (!this.isActive) return false;
  
  // Check if current time is within display window
  const now = new Date();
  if (now < this.startTime) return false;
  if (this.endTime && now > this.endTime) return false;
  
  // Check if user role is included
  if (!this.rolesVisibleTo.includes("All") && !this.rolesVisibleTo.includes(userRole)) {
    return false;
  }
  
  // Check if user has dismissed this popup
  const dismissed = this.dismissedBy.some(dismissal => 
    dismissal.userId.toString() === userId.toString()
  );
  
  return !dismissed;
};

// Instance method to mark popup as viewed by user
popupSchema.methods.markAsViewed = function(userId) {
  const alreadyViewed = this.viewedBy.some(view => 
    view.userId.toString() === userId.toString()
  );
  
  if (!alreadyViewed) {
    this.viewedBy.push({ userId });
  }
  
  return this.save();
};

// Instance method to mark popup as dismissed by user
popupSchema.methods.markAsDismissed = function(userId) {
  const alreadyDismissed = this.dismissedBy.some(dismissal => 
    dismissal.userId.toString() === userId.toString()
  );
  
  if (!alreadyDismissed) {
    this.dismissedBy.push({ userId });
  }
  
  return this.save();
};

// Static method to get active popups for a user
popupSchema.statics.getActivePopupsForUser = function(userRole, userId) {
  const now = new Date();
  
  return this.find({
    isActive: true,
    startTime: { $lte: now },
    $and: [
      {
        $or: [
          { endTime: { $exists: false } },
          { endTime: null },
          { endTime: { $gte: now } }
        ]
      },
      {
        $or: [
          { rolesVisibleTo: "All" },
          { rolesVisibleTo: userRole }
        ]
      }
    ],
    'dismissedBy.userId': { $ne: userId }
  })
  .populate('createdBy', 'name email')
  .sort({ createdAt: -1 });
};

module.exports = mongoose.model("Popup", popupSchema);