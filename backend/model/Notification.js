const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['User', 'Doctor', 'Patient', 'Admin']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  sourceType: {
    type: String,
    enum: ['Appointment', 'Payment', 'Patient', 'Treatment', 'XRay', 'Income', 'Expense', null],
    default: null
  },
  link: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByType',
    default: null
  },
  createdByType: {
    type: String,
    enum: ['User', 'Doctor', 'Patient', 'System', null],
    default: 'System'
  },
  targetRoles: [{
    type: String,
    enum: ['admin', 'superadmin', 'doctor', 'patient']
  }],
  soundEnabled: {
    type: Boolean,
    default: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Soft delete functionality
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      // Transform to match frontend expectations
      const result = {
        _id: ret._id,
        title: ret.title,
        description: ret.message,
        type: ret.type,
        isRead: ret.read,
        receiver: ret.userId,
        receiverModel: ret.userType,
        createdBy: ret.data?.createdBy || null,
        createdByModel: ret.data?.createdByModel || 'System',
        additionalData: ret.data,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt
      };
      return result;
    }
  }
});

// Indexes for faster queries
notificationSchema.index({ userId: 1, userType: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
