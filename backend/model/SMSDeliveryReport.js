const mongoose = require('mongoose');

const SMSDeliveryReportSchema = new mongoose.Schema(
  {
    // Reference to the SMS history record
    smsHistory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SMSHistory',
      required: true
    },
    // Aakash SMS message ID
    messageId: {
      type: String,
      required: true
    },
    // Delivery status from Aakash SMS
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'undelivered', 'scheduled', 'queued', 'aborted'],
      required: true
    },
    // Delivery timestamp
    deliveredAt: {
      type: Date
    },
    // Network provider
    networkProvider: {
      type: String
    },
    // Error message if failed
    errorMessage: {
      type: String
    },
    // Retry count
    retryCount: {
      type: Number,
      default: 0
    },
    // Cost information
    credit: {
      type: Number
    },
    // Recipient phone number
    recipient: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
SMSDeliveryReportSchema.index({ messageId: 1 });
SMSDeliveryReportSchema.index({ smsHistory: 1 });
SMSDeliveryReportSchema.index({ status: 1 });
SMSDeliveryReportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SMSDeliveryReport', SMSDeliveryReportSchema);