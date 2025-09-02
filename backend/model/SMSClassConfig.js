const mongoose = require('mongoose');

const SMSClassConfigSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      enum: ['A', 'B', 'C'],
      required: true,
      unique: true
    },
    patientLimit: {
      type: Number,
      default: 50,
      min: 1,
      max: 1000
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Static method to get class configurations with defaults
SMSClassConfigSchema.statics.getClassConfigs = async function() {
  const configs = await this.find();
  
  // Default configurations if none exist
  const defaults = [
    { className: 'A', patientLimit: 50, description: 'Class A patients', isActive: true },
    { className: 'B', patientLimit: 50, description: 'Class B patients', isActive: true },
    { className: 'C', patientLimit: 50, description: 'Class C patients', isActive: true }
  ];
  
  // Create missing configurations
  const existingClasses = configs.map(c => c.className);
  const missingConfigs = defaults.filter(d => !existingClasses.includes(d.className));
  
  if (missingConfigs.length > 0) {
    await this.insertMany(missingConfigs);
    return await this.find();
  }
  
  return configs;
};

module.exports = mongoose.model('SMSClassConfig', SMSClassConfigSchema);