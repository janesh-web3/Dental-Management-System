const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { 
      type: String,
      unique: true,
      index: true
    },
    paidAmount: { 
      type: Number, 
      required: true 
    },
    paymentMethod: { 
      type: String,
      enum: ["cash", "card", "bank", "upi"],
      required: true,
      default: "cash"
    },
    sourceType: {
      type: String,
      enum: ["Income", "Expenses", "Services Payment", "Patients"],
      required: true
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: false // Only required if payment is from Patients
    },
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add indexes for better query performance
invoiceSchema.index({ sourceType: 1, sourceId: 1 });
invoiceSchema.index({ patientId: 1 });
invoiceSchema.index({ date: -1 });
invoiceSchema.index({ invoiceNumber: 1 });

// Pre-save hook to generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    try {
      const count = await this.constructor.countDocuments();
      const year = new Date().getFullYear().toString().substr(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      this.invoiceNumber = `INV-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      console.error("Error generating invoice number:", error);
    }
  }
  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);
