const mongoose = require("mongoose");

const treatmentStepSchema = new mongoose.Schema({
  procedure: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["Planned", "In Progress", "Completed", "Cancelled"],
    default: "Planned"
  },
  plannedDate: { type: Date },
  completedDate: { type: Date },
  notes: { type: String },
  cost: { type: Number, default: 0 },
});

const treatmentPlanSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    diagnosis: { type: String, required: true },
    treatmentSteps: [treatmentStepSchema],
    totalCost: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    expectedEndDate: { type: Date },
    actualEndDate: { type: Date },
    status: { 
      type: String, 
      enum: ["Active", "Completed", "Cancelled"],
      default: "Active"
    },
    notes: { type: String },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadDate: { type: Date, default: Date.now },
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
  { timestamps: true }
);

// Update total cost when treatment steps are modified
treatmentPlanSchema.pre('save', function(next) {
  if (this.treatmentSteps && this.treatmentSteps.length > 0) {
    this.totalCost = this.treatmentSteps.reduce((sum, step) => 
      sum + (step.cost || 0), 0);
    
    // Check if all steps are completed
    const allCompleted = this.treatmentSteps.every(step => step.status === "Completed");
    if (allCompleted && this.status !== "Completed") {
      this.status = "Completed";
      this.actualEndDate = new Date();
    }
  }
  next();
});

module.exports = mongoose.model("TreatmentPlan", treatmentPlanSchema);
