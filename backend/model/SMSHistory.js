const mongoose = require('mongoose');

const SMSHistorySchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true,
      // Validate Nepali phone number format
      validate: {
        validator: function(v) {
          return /^9[678]\d{8}$/.test(v);
        },
        message: props => `${props.value} is not a valid Nepali phone number!`
      }
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed', 'undelivered', 'scheduled', 'queued', 'aborted'],
      default: 'pending'
    },
    messageId: {
      type: String
    },
    networkProvider: {
      type: String
    },
    credit: {
      type: Number
    },
    errorMessage: {
      type: String
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    templateUsed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SMSTemplate'
    },
    // Reference to the template used (duplicate of templateUsed for consistency)
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SMSTemplate'
    },
    scheduledFor: {
      type: Date
    },
    isBulk: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      enum: ['payment', 'followup', 'custom', 'appointment', 'other'],
      default: 'other'
    },
    campaignId: {
      type: String
    },
    patientClass: {
      type: String,
      enum: ['A', 'B', 'C'],
      default: null
    },
    // Delivery timestamp
    deliveredAt: {
      type: Date
    },
    // Retry count for failed messages
    retryCount: {
      type: Number,
      default: 0
    },
    // Group this SMS belongs to
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientGroup'
    },
    // Reference to a patient visit if linked to a doctor visit
    visitReference: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    // Cost estimation
    estimatedCost: {
      type: Number,
      default: 0
    },
    // Group name for display purposes
    groupName: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SMSHistory', SMSHistorySchema);