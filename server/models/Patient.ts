import mongoose, { Document, Schema } from 'mongoose';

export interface IPersonalDetails {
  name: string;
  contactNumber: string;
  emailAddress?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ITreatment {
  procedure: mongoose.Types.ObjectId;
  group?: mongoose.Types.ObjectId;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  date: Date;
  notes?: string;
  cost: number;
  teethNumbers?: number[];
  doctor: mongoose.Types.ObjectId;
}

export interface IPayment {
  amount: number;
  date: Date;
  method: 'cash' | 'card' | 'online' | 'insurance';
  reference?: string;
  notes?: string;
  receivedBy: mongoose.Types.ObjectId;
}

export interface IPatient extends Document {
  personalDetails: IPersonalDetails;
  medicalHistory?: {
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
    notes?: string;
  };
  treatments: ITreatment[];
  payments: IPayment[];
  followUpDate?: Date;
  lastVisit?: Date;
  status: 'active' | 'inactive' | 'archived';
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    personalDetails: {
      name: { type: String, required: true },
      contactNumber: { type: String, required: true },
      emailAddress: { type: String },
      dateOfBirth: { type: Date },
      gender: { type: String, enum: ['male', 'female', 'other'] },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String },
    },
    medicalHistory: {
      allergies: [{ type: String }],
      medications: [{ type: String }],
      conditions: [{ type: String }],
      notes: { type: String },
    },
    treatments: [
      {
        procedure: { type: Schema.Types.ObjectId, ref: 'Procedure', required: true },
        group: { type: Schema.Types.ObjectId, ref: 'ProcedureGroup' },
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed', 'cancelled'],
          default: 'pending',
        },
        date: { type: Date, default: Date.now },
        notes: { type: String },
        cost: { type: Number, required: true },
        teethNumbers: [{ type: Number }],
        doctor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    payments: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        method: {
          type: String,
          enum: ['cash', 'card', 'online', 'insurance'],
          required: true,
        },
        reference: { type: String },
        notes: { type: String },
        receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    followUpDate: { type: Date },
    lastVisit: { type: Date },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Indexes for better query performance
PatientSchema.index({ 'personalDetails.name': 'text' });
PatientSchema.index({ 'personalDetails.contactNumber': 1 });
PatientSchema.index({ 'personalDetails.emailAddress': 1 });
PatientSchema.index({ status: 1 });
PatientSchema.index({ followUpDate: 1 });

// Calculate total paid amount
PatientSchema.virtual('totalPaid').get(function () {
  return this.payments.reduce((sum, payment) => sum + payment.amount, 0);
});

// Calculate total treatment cost
PatientSchema.virtual('totalTreatmentCost').get(function () {
  return this.treatments.reduce((sum, treatment) => sum + (treatment.cost || 0), 0);
});

// Check if patient has pending payment
PatientSchema.virtual('hasPendingPayment').get(function () {
  return this.totalPaid < this.totalTreatmentCost;
});

// Calculate pending amount
PatientSchema.virtual('pendingAmount').get(function () {
  return Math.max(0, this.totalTreatmentCost - this.totalPaid);
});

const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
export default Patient;
