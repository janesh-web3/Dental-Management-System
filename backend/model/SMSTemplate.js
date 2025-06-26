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
      enum: ['Appointment', 'Reminder', 'Promotion', 'General', 'Other'],
      default: 'General'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('SMSTemplate', SMSTemplateSchema);
