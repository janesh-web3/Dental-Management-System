const mongoose = require('mongoose');

const SMSTemplateGroupSchema = new mongoose.Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SMSTemplate',
      required: true,
      index: true
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientGroup',
      required: true,
      index: true
    },
    sendDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Store the number of patients in the group at the time of sending
    patientCount: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Add compound index for efficient queries
SMSTemplateGroupSchema.index({ templateId: 1, groupId: 1 });
SMSTemplateGroupSchema.index({ sentBy: 1 });
SMSTemplateGroupSchema.index({ sendDate: -1 });

// Add a method to populate group and user information
SMSTemplateGroupSchema.methods.populateInfo = async function() {
  await this.populate([
    { path: 'groupId', select: 'name patientCount' },
    { path: 'sentBy', select: 'name' }
  ]);
  return this;
};

module.exports = mongoose.model('SMSTemplateGroup', SMSTemplateGroupSchema);