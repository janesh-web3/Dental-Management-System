import mongoose, { Document, Schema } from 'mongoose';

export interface ISMSSettings extends Document {
  bulkSMS: boolean;
  followupSMS: boolean;
  paymentSMS: boolean;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const SMSSettingsSchema = new Schema<ISMSSettings>({
  bulkSMS: { type: Boolean, default: true },
  followupSMS: { type: Boolean, default: true },
  paymentSMS: { type: Boolean, true: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Create or get the single settings document
SMSSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      bulkSMS: true,
      followupSMS: true,
      paymentSMS: true,
      updatedBy: new mongoose.Types.ObjectId() // Default user, will be updated
    });
  }
  return settings;
};

const SMSSettings = mongoose.model<ISMSSettings>('SMSSettings', SMSSettingsSchema);
export default SMSSettings;
