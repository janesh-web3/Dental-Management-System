const mongoose = require('mongoose');

const SMSCampaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    totalPatients: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'in_progress', 'completed', 'failed'],
      default: 'draft'
    },
    classes: [{
      className: {
        type: String,
        enum: ['A', 'B', 'C'],
        required: true
      },
      patientCount: {
        type: Number,
        default: 0
      },
      sentCount: {
        type: Number,
        default: 0
      },
      failedCount: {
        type: Number,
        default: 0
      },
      isSent: {
        type: Boolean,
        default: false
      },
      sentAt: {
        type: Date
      },
      patientIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient'
      }]
    }],
    templateUsed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SMSTemplate'
    },
    scheduledFor: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Generate unique campaign ID
SMSCampaignSchema.pre('save', function(next) {
  if (this.isNew) {
    this.name = this.name || `Campaign_${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('SMSCampaign', SMSCampaignSchema);