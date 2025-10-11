const mongoose = require('mongoose');

const PatientGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    // Dynamic filters used to create this group
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // Static list of patient IDs (for manually created groups)
    patientIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    }],
    // Count of patients in the group
    patientCount: {
      type: Number,
      default: 0
    },
    // Category/type of group
    category: {
      type: String,
      enum: ['Dynamic', 'Static', 'Smart'],
      default: 'Static'
    },
    // Creator of the group
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Last time this group was used for sending SMS
    lastUsed: {
      type: Date,
      default: null
    },
    // Whether this group is active
    isActive: {
      type: Boolean,
      default: true
    },
    // Last template used with this group
    lastTemplateUsed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SMSTemplate'
    },
    // Quick filter presets
    presetFilters: {
      todayFollowUps: {
        type: Boolean,
        default: false
      },
      duePayments: {
        type: Boolean,
        default: false
      },
      missedVisits: {
        type: Boolean,
        default: false
      },
      newPatients: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

// Index for faster queries
PatientGroupSchema.index({ name: 1 });
PatientGroupSchema.index({ createdBy: 1 });
PatientGroupSchema.index({ category: 1 });
PatientGroupSchema.index({ lastUsed: -1 });

module.exports = mongoose.model('PatientGroup', PatientGroupSchema);