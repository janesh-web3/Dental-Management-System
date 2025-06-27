import mongoose, { Document, Schema } from 'mongoose';

export type SMSStatus = 'success' | 'error' | 'pending';
export type SMSType = 'single' | 'bulk' | 'followup' | 'payment_reminder';

export interface ISMSLog extends Document {
  patient?: mongoose.Types.ObjectId | mongoose.Types.ObjectId[];
  message: string;
  status: SMSStatus;
  response: any;
  type: SMSType;
  sentBy: mongoose.Types.ObjectId;
  filterCriteria?: any;
  amount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const SMSLogSchema = new Schema<ISMSLog>(
  {
    patient: {
      type: Schema.Types.Mixed,
      ref: 'Patient',
    },
    message: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['success', 'error', 'pending'],
      required: true 
    },
    response: { type: Schema.Types.Mixed },
    type: { 
      type: String, 
      enum: ['single', 'bulk', 'followup', 'payment_reminder'],
      required: true 
    },
    sentBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true 
    },
    filterCriteria: { type: Schema.Types.Mixed },
    amount: { type: Number },
  },
  { timestamps: true }
);

// Indexes for better query performance
SMSLogSchema.index({ type: 1 });
SMSLogSchema.index({ status: 1 });
SMSLogSchema.index({ sentBy: 1 });
SMSLogSchema.index({ createdAt: -1 });

const SMSLog = mongoose.model<ISMSLog>('SMSLog', SMSLogSchema);
export default SMSLog;
