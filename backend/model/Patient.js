const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

// First, create a schema for daily treatments
const dailyTreatmentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  treatmentAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },           
  remainingAmount: { type: Number, default: 0 },
  procedure: { type: String }, // Add this new field
  notes: { type: String },
  treatedByDoctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Doctor",
    default: null  // Add default null
  },
  isCompleted: { type: Boolean, default: false } // Add this field to track completion
});

// Update the selected tooth schema to include daily treatments
const selectedToothSchema = new mongoose.Schema({
  number: { type: String },
  position: { type: String },
  procedure: { type: String },
  side: { type: String }, 
  dailyTreatments: [dailyTreatmentSchema],
  totalTreatmentAmount: { type: Number, default: 0 },
  totalPaidAmount: { type: Number, default: 0 },
  totalRemainingAmount: { type: Number, default: 0 },
  startDate: { type: Date },
  completionDate: { type: Date },
  isCompleted: { type: Boolean, default: false }
});

// Modify the pre-save middleware to update tooth completion status
selectedToothSchema.pre('save', function(next) {
  if (this.dailyTreatments && this.dailyTreatments.length > 0) {
    // Calculate totals as before
    this.totalTreatmentAmount = this.dailyTreatments.reduce((sum, treatment) => 
      sum + (treatment.treatmentAmount || 0), 0);
    this.totalPaidAmount = this.dailyTreatments.reduce((sum, treatment) => 
      sum + (treatment.paidAmount || 0), 0);
    this.totalRemainingAmount = this.totalTreatmentAmount - this.totalPaidAmount;
    
    // Check if any daily treatment is marked as completed
    const hasCompletedTreatment = this.dailyTreatments.some(treatment => treatment.isCompleted);
    
    // Update the tooth's completion status
    if (hasCompletedTreatment && !this.isCompleted) {
      this.isCompleted = true;
      this.completionDate = new Date();
    }
  }
  next();
});

// Update the treatment planning schema
const treatmentPlanningSchema = new mongoose.Schema({
  patientType: { type: String, default: "Adult" },
  isCompleted: { type: Boolean, default: false },
  selectedTeethDetails: [selectedToothSchema],
  teethNumber: { type: String },
  treatmentDate: { type: Date },
  treatmentDateNp: { type: String }, // Add Nepali date field
  treatmentDocuments: [
    {
      fileName: String,
      fileUrl: String,
      uploadDate: String,
      publicId: String,
      description: String,
    },
  ],
  treatmentFindings: { type: String },
  clinicalFindings: [{ type: String }],
  otherFindings: { type: String },
  followUpDate: { type: Date },
  followUpDateNp: { type: String }, // Add Nepali date field
  totalPlanAmount: { type: Number, default: 0 },
  totalPaidAmount: { type: Number, default: 0 },
  totalRemainingAmount: { type: Number, default: 0 },
  completionDate: { type: Date },
  completionDateNp: { type: String } // Add Nepali date field
});

// Update the treatment planning schema pre-save middleware
treatmentPlanningSchema.pre('save', function(next) {
  if (this.selectedTeethDetails && this.selectedTeethDetails.length > 0) {
    // Calculate totals from all teeth
    let totalPlanAmount = 0;
    let totalPaidAmount = 0;

    this.selectedTeethDetails.forEach(tooth => {
      if (tooth.dailyTreatments && tooth.dailyTreatments.length > 0) {
        // Sum up all treatment amounts for this tooth
        const toothTreatmentAmount = tooth.dailyTreatments.reduce((sum, treatment) => 
          sum + (treatment.treatmentAmount || 0), 0);
        
        // Sum up all paid amounts for this tooth
        const toothPaidAmount = tooth.dailyTreatments.reduce((sum, treatment) => 
          sum + (treatment.paidAmount || 0), 0);

        // Update tooth totals
        tooth.totalTreatmentAmount = toothTreatmentAmount;
        tooth.totalPaidAmount = toothPaidAmount;
        tooth.totalRemainingAmount = toothTreatmentAmount - toothPaidAmount;

        // Add to plan totals
        totalPlanAmount += toothTreatmentAmount;
        totalPaidAmount += toothPaidAmount;
      }
    });

    // Update plan totals
    this.totalPlanAmount = totalPlanAmount;
    this.totalPaidAmount = totalPaidAmount;
    this.totalRemainingAmount = totalPlanAmount - totalPaidAmount;

    // Update completion status
    this.isCompleted = this.totalRemainingAmount === 0 && this.totalPlanAmount > 0;
  }
  next();
});

// Add this new schema before the medicalDetailsSchema
const medicalHistorySchema = new mongoose.Schema({
  bloodPressure: { type: String },
  diabetes: { type: Boolean, default: false },
  thyroid: { type: Boolean, default: false },
  bleedingDisorder: { type: Boolean, default: false },
  pregnancy: { type: Boolean, default: false },
  asthma: { type: Boolean, default: false },
  allergies: { type: String },
  otherConditions: { type: String },
  noMedicalIssues: { type: Boolean, default: false } // Add this new field
});

// Update the investigation field in the schema
const medicalDetailsSchema = new mongoose.Schema({
  chiefComplaint: { type: String },
  diagnosis: { type: String },
  investigation: {
    blood: { type: String },
    xray: { type: String }
  },
  medicalHistory: medicalHistorySchema,
  patientType: {
    type: String,
    enum: ["Adult", "Child"],
    default: "Adult",
  },
  treatmentPlanning: [treatmentPlanningSchema],
  followUpDate: { type: Date },
});

// Schema for Personal Details
const personalDetailsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required!"],
    minLength: [3, "Name must contain at least 3 characters!"],
  },
  contactNumber: {
    type: String,
    validate: {
      validator: function (v) {
        return v === '' || v === null || /\d{10}/.test(v);
      },
      message: (props) => `${props.value} is not a valid phone number!`,
    },
  },
  gender: {
    type: String,
    required: [true, "Gender is required!"],
    enum: ["Male", "Female", "Other"],
  },
  sn: { type: String },
  address: { type: String },
  age: { type: String },
  emailAddress: { 
    type: String,
  },
  referredBy: { type: String },
  checkUpDate: { type: Date },
  checkUpDateNp: { type: String }, // Add Nepali date field
  createdAt: { type: Date },
  updatedAt: { type: Date },
  // Add profile photo fields
  profilePhoto: {
    url: { type: String },
    publicId: { type: String }
  }
})

// Main Patient Schema
const patientSchema = new mongoose.Schema(
  {
    personalDetails: { type: personalDetailsSchema, },
    medicalDetails: [medicalDetailsSchema],
    email: { 
      type: String,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"]
    },
    appointments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    // Add documents field for general patient documents
    documents: [
      {
        fileName: String,
        fileUrl: String,
        uploadDate: String,
        publicId: String,
        description: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
patientSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
patientSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create a virtual for patient's full name
patientSchema.virtual('fullName').get(function() {
  return this.personalDetails?.name || '';
});

// Create a virtual for patient's contact info
patientSchema.virtual('contact').get(function() {
  return this.personalDetails?.contactNumber || '';
});

module.exports = mongoose.model("Patient", patientSchema);
