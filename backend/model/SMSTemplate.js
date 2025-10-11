const mongoose = require('mongoose');

const SMSTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    variables: [{
      type: String,
      trim: true
    }],
    category: {
      type: String,
      enum: ['Appointment', 'Reminder', 'Promotion', 'General', 'Other', 'Payment Due', 'Missed Visit', 'Birthday Wish', 'Feedback Request'],
      default: 'General'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isAutoTriggered: {
      type: Boolean,
      default: false
    },
    triggerEvent: {
      type: String,
      enum: ['appointment_booking', 'appointment_cancellation', 'missed_visit', 'payment_due', 'birthday', 'feedback_request', 'follow_up'],
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastUsed: {
      type: Date,
      default: null
    },
    totalSent: {
      type: Number,
      default: 0
    },
    // Character count for cost estimation
    characterCount: {
      type: Number,
      default: 0
    },
    // Whether this template can be scheduled
    isSchedulable: {
      type: Boolean,
      default: true
    },
    // Color coding for UI
    colorTag: {
      type: String,
      enum: ['green', 'blue', 'yellow', 'red', 'purple', 'gray'],
      default: 'gray'
    },
    // Sender ID for Aakash SMS
    senderId: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SMSTemplate', SMSTemplateSchema);