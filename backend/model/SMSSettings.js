const mongoose = require('mongoose');

const SMSSettingsSchema = new mongoose.Schema(
  {
    bulkSMS: {
      type: Boolean,
      default: true
    },
    followupSMS: {
      type: Boolean,
      default: true
    },
    paymentSMS: {
      type: Boolean,
      default: true
    },
    autoAppointmentReminder: {
      type: Boolean,
      default: false
    },
    reminderHoursBeforeAppointment: {
      type: Number,
      default: 24
    },
    dailyLimit: {
      type: Number,
      default: 500
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    clinicName: {
      type: String,
      default: 'Dental Clinic'
    },
    senderName: {
      type: String,
      default: 'Dental Clinic'
    }
  },
  {
    timestamps: true
  }
);

// Add a static method to get or create settings
SMSSettingsSchema.statics.getSettings = async function() {
  // Get the first settings document or create one if it doesn't exist
  let settings = await this.findOne({});
  
  if (!settings) {
    settings = await this.create({});
  }
  
  return settings;
};

module.exports = mongoose.model('SMSSettings', SMSSettingsSchema);
