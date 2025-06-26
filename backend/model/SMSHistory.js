const mongoose = require('mongoose');

const SMSHistorySchema = new mongoose.Schema(
  {
    recipient: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'undelivered', 'scheduled', 'queued', 'aborted'],
      default: 'sent'
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
    scheduledFor: {
      type: Date
    },
    isBulk: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SMSHistory', SMSHistorySchema);
