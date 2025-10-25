const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");

// First, create a schema for follow-ups
const followUpSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  reason: { type: String },
  type: { 
    type: String, 
    enum: ["Treatment Review", "Orthodontic Check", "Pain Assessment", "Routine Check", "Post-Surgery", "Cleaning", "X-Ray Review", "Other"],
    default: "Routine Check"
  },
  linkedTo: {
    type: { 
      type: String, 
      enum: ["treatment", "groupTreatment", "tooth", "medicalRecord"],
      required: true
    },
    entityId: { type: String } // ID of the linked entity 
  },
  completed: { type: Boolean, default: false },
  completedDate: { type: Date },
  notes: { type: String },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: { type: Date, default: Date.now }
});

// Create a schema for daily treatments


const dailyTreatmentSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  treatmentAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  paymentDate: { type: Date }, // Add payment date field
  paymentMethod: { 
    type: String, 
   enum: ["Cash", "Bank Transfer", "E-sewa", "Khalti", "Other"],
    default: "Cash" 
  },
  procedure: { type: String }, // Add this new field
  notes: { type: String },
  treatedByDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctor",
    default: null, // Add default null
  },
  isCompleted: { type: Boolean, default: false }, // Add this field to track completion
});

const groupTreatmentDetailsSchema = new mongoose.Schema({
  groupName: {
    type: String,
    enum: ["Ortho", "Endo", "Perio", "Prostho", "Surgery", "General", "Other"],
    default: "General",
  },
  procedure: { type: String }, // Add procedure field
  totalTreatmentAmount: { type: Number, default: 0 },
  totalPaidAmount: { type: Number, default: 0 },
  totalRemainingAmount: { type: Number, default: 0 },
  startDate: { type: Date },
  completionDate: { type: Date },
  treatedByDoctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
  isCompleted: { type: Boolean, default: false },
  dailyTreatments: [dailyTreatmentSchema],
});

// Add pre-save middleware for group treatment calculations
groupTreatmentDetailsSchema.pre("save", function (next) {
  // Ensure dailyTreatments is always an array
  if (!this.dailyTreatments) {
    this.dailyTreatments = [];
  }

  if (this.dailyTreatments && this.dailyTreatments.length > 0) {
    // Calculate totals from daily treatments
    const calculatedTreatmentAmount = this.dailyTreatments.reduce(
      (sum, treatment) => sum + (Number(treatment.treatmentAmount) || 0),
      0
    );
    const calculatedPaidAmount = this.dailyTreatments.reduce(
      (sum, treatment) => sum + (Number(treatment.paidAmount) || 0),
      0
    );
    
    // Update totals if they weren't explicitly set or if calculated amounts are greater
    if (!this.totalTreatmentAmount || this.totalTreatmentAmount === 0 || calculatedTreatmentAmount > this.totalTreatmentAmount) {
      this.totalTreatmentAmount = calculatedTreatmentAmount;
    }
    if (!this.totalPaidAmount || this.totalPaidAmount === 0 || calculatedPaidAmount > this.totalPaidAmount) {
      this.totalPaidAmount = calculatedPaidAmount;
    }
    
    // Always recalculate remaining amount based on current totals
    this.totalRemainingAmount = this.totalTreatmentAmount - this.totalPaidAmount;

    // Check if all daily treatments are completed
    const allCompleted = this.dailyTreatments.every(treatment => treatment.isCompleted);
    if (allCompleted && this.dailyTreatments.length > 0 && !this.isCompleted) {
      this.isCompleted = true;
      if (!this.completionDate) {
        this.completionDate = new Date();
      }
    }

    // If no daily treatments are completed, ensure group is not marked as completed
    const anyCompleted = this.dailyTreatments.some(treatment => treatment.isCompleted);
    if (!anyCompleted && this.isCompleted) {
      this.isCompleted = false;
      this.completionDate = undefined;
    }
  } else {
    // If no daily treatments, ensure remaining amount is calculated correctly
    this.totalRemainingAmount = (this.totalTreatmentAmount || 0) - (this.totalPaidAmount || 0);
  }
  
  next();
});

// Update the selected tooth schema to include daily treatmentsb
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
  isCompleted: { type: Boolean, default: false },
});

// Modify the pre-save middleware to update tooth completion status
selectedToothSchema.pre("save", function (next) {
  if (this.dailyTreatments && this.dailyTreatments.length > 0) {
    // Calculate totals with more explicit checks for null/undefined values
    this.totalTreatmentAmount = this.dailyTreatments.reduce(
      (sum, treatment) => sum + (Number(treatment.treatmentAmount) || 0),
      0
    );
    this.totalPaidAmount = this.dailyTreatments.reduce(
      (sum, treatment) => sum + (Number(treatment.paidAmount) || 0),
      0
    );
    this.totalRemainingAmount =
      this.totalTreatmentAmount - this.totalPaidAmount;

    // Check if any daily treatment is marked as completed
    const hasCompletedTreatment = this.dailyTreatments.some(
      (treatment) => treatment.isCompleted
    );

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
  groupTreatmentDetails: [groupTreatmentDetailsSchema],
  teethNumber: { type: String },
  treatmentDate: { type: Date },
  treatmentDateNp: { type: String }, // Add Nepali date field
  followUpDate: { type: Date }, // Add follow-up date field
  followUpDateNp: { type: String }, // Add Nepali follow-up date field
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
  followUps: [followUpSchema], // Add follow-ups array
  totalPlanAmount: { type: Number, default: 0 },
  totalPaidAmount: { type: Number, default: 0 },
  totalRemainingAmount: { type: Number, default: 0 },
  completionDate: { type: Date },
  completionDateNp: { type: String }, // Add Nepali date field
});

// Update the treatment planning schema pre-save middleware
treatmentPlanningSchema.pre("save", function (next) {
  // Call the calculation method
  this.calculateTotals();
  next();
});

// Add a method to calculate totals that can be called manually
treatmentPlanningSchema.methods.calculateTotals = function() {
  let totalPlanAmount = 0;
  let totalPaidAmount = 0;

  // Calculate totals for selectedTeethDetails
  if (this.selectedTeethDetails && this.selectedTeethDetails.length > 0) {
    this.selectedTeethDetails.forEach(tooth => {
      if (tooth.dailyTreatments && tooth.dailyTreatments.length > 0) {
        const toothTreatmentAmount = tooth.dailyTreatments.reduce((sum, treatment) => 
          sum + (Number(treatment.treatmentAmount) || 0), 0);
        
        const toothPaidAmount = tooth.dailyTreatments.reduce((sum, treatment) => 
          sum + (Number(treatment.paidAmount) || 0), 0);

        tooth.totalTreatmentAmount = toothTreatmentAmount;
        tooth.totalPaidAmount = toothPaidAmount;
        tooth.totalRemainingAmount = toothTreatmentAmount - toothPaidAmount;

        totalPlanAmount += toothTreatmentAmount;
        totalPaidAmount += toothPaidAmount;
      }
    });
  }

  // Calculate totals for groupTreatmentDetails
  if (this.groupTreatmentDetails && this.groupTreatmentDetails.length > 0) {
    this.groupTreatmentDetails.forEach(group => {
      // Ensure daily treatments is an array
      if (!group.dailyTreatments) {
        group.dailyTreatments = [];
      }

      // If group has daily treatments, calculate from them
      if (group.dailyTreatments && group.dailyTreatments.length > 0) {
        const groupTreatmentAmount = group.dailyTreatments.reduce((sum, treatment) => 
          sum + (Number(treatment.treatmentAmount) || 0), 0);
        
        const groupPaidAmount = group.dailyTreatments.reduce((sum, treatment) => 
          sum + (Number(treatment.paidAmount) || 0), 0);

        // Update totals based on daily treatments
        group.totalTreatmentAmount = Math.max(groupTreatmentAmount, group.totalTreatmentAmount || 0);
        group.totalPaidAmount = Math.max(groupPaidAmount, group.totalPaidAmount || 0);
        group.totalRemainingAmount = group.totalTreatmentAmount - group.totalPaidAmount;

        // Check completion status
        const allCompleted = group.dailyTreatments.every(dt => dt.isCompleted);
        if (allCompleted && group.dailyTreatments.length > 0) {
          group.isCompleted = true;
          if (!group.completionDate) {
            group.completionDate = new Date();
          }
        }
      } else {
        // No daily treatments, just ensure remaining amount is calculated
        group.totalRemainingAmount = (group.totalTreatmentAmount || 0) - (group.totalPaidAmount || 0);
      }
      
      // Add to plan totals (use the group's total amounts)
      totalPlanAmount += group.totalTreatmentAmount || 0;
      totalPaidAmount += group.totalPaidAmount || 0;
    });
  }

  this.totalPlanAmount = totalPlanAmount;
  this.totalPaidAmount = totalPaidAmount;
  this.totalRemainingAmount = totalPlanAmount - totalPaidAmount;

  this.isCompleted = this.totalRemainingAmount === 0 && this.totalPlanAmount > 0;

  if (this.isCompleted && !this.completionDate) {
    this.completionDate = new Date();
  }

  return this;
};

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
  noMedicalIssues: { type: Boolean, default: false }, // Add this new field
});

// Update the investigation field in the schema
const medicalDetailsSchema = new mongoose.Schema({
  chiefComplaint: { type: String },
  diagnosis: { type: String },
  investigation: {
    blood: { type: String },
    xray: { type: String },
  },
  group: { // Add group field
    type: String,
    enum: ["General", "Ortho", "Endo", "Perio", "Prostho", "Surgery", "Other"],
    default: "General",
  },
  medicalHistory: medicalHistorySchema,
  patientType: {
    type: String,
    enum: ["Adult", "Child"],
    default: "Adult",
  },
  treatmentPlanning: [treatmentPlanningSchema],
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
        return v === "" || v === null || /\d{10}/.test(v);
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
    publicId: { type: String },
  },
});

// Main Patient Schema
const patientSchema = new mongoose.Schema(
  {
    personalDetails: { type: personalDetailsSchema },
    medicalDetails: [medicalDetailsSchema],
    email: {
      type: String,
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"],
    },
    appointments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    // Patient Status field for New/Old classification
    patientStatus: {
      type: String,
      enum: ["New", "Old"],
      default: "New",
    },
    // Track last visit/activity date for automatic status logic
    lastVisitDate: {
      type: Date,
    },
    // Track first treatment/invoice date to determine when to change to Old
    firstTreatmentDate: {
      type: Date,
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
    // Soft delete functionality
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Add the method here after patientSchema is defined
patientSchema.methods.recalculateTreatmentTotals = function () {
  if (this.medicalDetails && this.medicalDetails.length > 0) {
    this.medicalDetails.forEach((medical) => {
      if (medical.treatmentPlanning && medical.treatmentPlanning.length > 0) {
        medical.treatmentPlanning.forEach((plan) => {
          plan.calculateTotals();
        });
      }
    });
  }
  return this;
};

// Method to update patient status based on activity
patientSchema.methods.updatePatientStatus = function () {
  const now = new Date();

  // Check if patient has any treatments or invoices
  let hasActivity = false;
  let earliestActivityDate = null;

  if (this.medicalDetails && this.medicalDetails.length > 0) {
    this.medicalDetails.forEach((medical) => {
      if (medical.treatmentPlanning && medical.treatmentPlanning.length > 0) {
        medical.treatmentPlanning.forEach((plan) => {
          // Check for treatments in selectedTeethDetails
          if (plan.selectedTeethDetails && plan.selectedTeethDetails.length > 0) {
            plan.selectedTeethDetails.forEach((tooth) => {
              if (tooth.dailyTreatments && tooth.dailyTreatments.length > 0) {
                hasActivity = true;
                tooth.dailyTreatments.forEach((treatment) => {
                  if (treatment.date && (!earliestActivityDate || treatment.date < earliestActivityDate)) {
                    earliestActivityDate = treatment.date;
                  }
                });
              }
            });
          }

          // Check for treatments in groupTreatmentDetails
          if (plan.groupTreatmentDetails && plan.groupTreatmentDetails.length > 0) {
            plan.groupTreatmentDetails.forEach((group) => {
              if (group.dailyTreatments && group.dailyTreatments.length > 0) {
                hasActivity = true;
                group.dailyTreatments.forEach((treatment) => {
                  if (treatment.date && (!earliestActivityDate || treatment.date < earliestActivityDate)) {
                    earliestActivityDate = treatment.date;
                  }
                });
              }
            });
          }

          // Check treatment date
          if (plan.treatmentDate) {
            hasActivity = true;
            if (!earliestActivityDate || plan.treatmentDate < earliestActivityDate) {
              earliestActivityDate = plan.treatmentDate;
            }
          }
        });
      }
    });
  }

  // Update firstTreatmentDate if we found activity and don't have one set
  if (hasActivity && earliestActivityDate && !this.firstTreatmentDate) {
    this.firstTreatmentDate = earliestActivityDate;
  }

  // Update lastVisitDate to most recent activity
  this.lastVisitDate = now;

  // Logic for changing status to "Old"
  if (hasActivity && this.patientStatus === "New") {
    this.patientStatus = "Old";
  }

  // Logic for patients who haven't visited in over 12 months
  // (This would typically require manual confirmation, but we'll mark for review)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  if (this.lastVisitDate && this.lastVisitDate < twelveMonthsAgo && this.patientStatus === "Old") {
    // Could add a flag here for manual review if needed
    // For now, we'll keep them as "Old" but this could be extended
  }

  return this;
};

// Method to manually set patient status (for manual override)
patientSchema.methods.setPatientStatus = function (status) {
  if (["New", "Old"].includes(status)) {
    this.patientStatus = status;
  }
  return this;
};

// Method to check if patient should be considered for "New Again" status
patientSchema.methods.shouldConsiderNewAgain = function () {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  return (
    this.patientStatus === "Old" &&
    this.lastVisitDate &&
    this.lastVisitDate < twelveMonthsAgo
  );
};

// Hash password before saving
patientSchema.pre("save", async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified("password")) return next();

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
patientSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Create a virtual for patient's full name
patientSchema.virtual("fullName").get(function () {
  return this.personalDetails?.name || "";
});

// Create a virtual for patient's contact info
patientSchema.virtual("contact").get(function () {
  return this.personalDetails?.contactNumber || "";
});

// Add a pre-save hook to ensure createdAt is set in personalDetails and handle patient status
patientSchema.pre("save", function (next) {
  // If this is a new patient (being created for the first time)
  if (this.isNew && this.personalDetails) {
    // Set createdAt in personalDetails if not already set
    if (!this.personalDetails.createdAt) {
      this.personalDetails.createdAt = new Date();
    }
    // Ensure new patients start with "New" status
    if (!this.patientStatus) {
      this.patientStatus = "New";
    }
  }

  // Auto-update patient status if medical details have been modified
  if (this.isModified('medicalDetails') && !this.isNew) {
    this.updatePatientStatus();
  }

  // Handle automatic status change for old patients (yearly check)
  // Mark patients from previous year as "Old" if they haven't been updated this year
  const currentYear = new Date().getFullYear();
  const lastUpdateYear = this.updatedAt ? this.updatedAt.getFullYear() : currentYear;

  if (lastUpdateYear < currentYear && this.patientStatus === "New") {
    // If patient data hasn't been updated this year and they're still "New",
    // check if they have any activity to determine if they should be "Old"
    let hasAnyActivity = false;
    if (this.medicalDetails && this.medicalDetails.length > 0) {
      this.medicalDetails.forEach((medical) => {
        if (medical.treatmentPlanning && medical.treatmentPlanning.length > 0) {
          hasAnyActivity = true;
        }
      });
    }

    if (hasAnyActivity) {
      this.patientStatus = "Old";
    }
  }

  next();
});

module.exports = mongoose.model("Patient", patientSchema);


