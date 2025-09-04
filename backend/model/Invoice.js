const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  // For dental-specific fields
  treatmentType: { 
    type: String, 
    enum: ['general', 'orthodontic', 'surgical', 'preventive', 'cosmetic', 'other'],
    required: true 
  },
  treatmentId: { 
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'items.treatmentModel'
  },
  treatmentModel: {
    type: String,
    required: true,
    enum: ['Treatment', 'OrthoTreatment', 'DailyTreatment']
  },
  // For tracking selected teeth
  teethNumbers: [{
    type: String,
    validate: {
      validator: function(v) {
        // Validate tooth number format (e.g., 11, 21, 32, 48, etc.)
        return /^[1-8][1-8]?$/.test(v);
      },
      message: props => `${props.value} is not a valid tooth number!`
    }
  }],
  notes: String
});

// Payment log schema
const paymentLogSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { 
    type: String,
    required: true,
    enum: ["Cash", "Bank Transfer", "E-sewa", "Khalti", "Credit Card", "Debit Card", "Insurance", "Other"]
  },
  transactionId: String,
  notes: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

const invoiceSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: false, // Made optional for income/expense/service invoices
    },
    patientName: {
      type: String,
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: false, // Made optional for income/expense/service invoices
    },
    doctorName: {
      type: String,
      required: true
    },
    invoiceNumber: { 
      type: String,
      required: true,
      unique: true,
      index: true
    },
    invoiceDate: { 
      type: Date,
      default: Date.now 
    },
    dueDate: { 
      type: Date,
      required: true 
    },
    // For orthodontic group payments
    orthoGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrthoGroup'
    },
    installmentNumber: Number,
    totalInstallments: Number,
    
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountType: { 
      type: String, 
      enum: ['percentage', 'fixed'],
      default: 'fixed'
    },
    total: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["Draft", "Sent", "Paid", "Partially Paid", "Overdue", "Cancelled", "Refunded"],
      default: "Draft"
    },
    paymentMethod: { 
      type: String,
      enum: ["Cash", "Bank Transfer", "E-sewa", "Khalti", "Credit Card", "Debit Card", "Insurance", "Other"],
      default: "Cash"
    },
    notes: { type: String },
    treatmentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TreatmentPlan"
    },
    // Source tracking for cascade delete functionality
    sourceType: {
      type: String,
      enum: ["Income", "Expense", "ServicePayment", "Treatment", "Registration", "Manual", "Patient"],
      required: false // Optional for backward compatibility
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false // Optional for backward compatibility
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
invoiceSchema.index({ patient: 1, status: 1 });
invoiceSchema.index({ doctor: 1, status: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ sourceType: 1, sourceId: 1 }); // For cascade delete queries

// Virtual for payment logs
invoiceSchema.virtual('paymentLogs', {
  ref: 'PaymentLog',
  localField: '_id',
  foreignField: 'invoice',
  justOne: false
});

// Pre-save hook to generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    this.invoiceNumber = `INV-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;
  }
  
  // Calculate balance
  this.balance = this.total - this.amountPaid;
  
  // Update status based on payment
  if (this.amountPaid <= 0) {
    this.status = 'Sent';
  } else if (this.amountPaid >= this.total) {
    this.status = 'Paid';
  } else {
    this.status = 'Partially Paid';
  }
  
  next();
});

// Update balance when amount paid changes
invoiceSchema.pre('save', function(next) {
  this.balance = this.total - this.amountPaid;
  
  // Update status based on payment
  if (this.amountPaid >= this.total) {
    this.status = "Paid";
  } else if (this.amountPaid > 0) {
    this.status = "Partially Paid";
  } else if (new Date() > this.dueDate && this.status !== "Paid") {
    this.status = "Overdue";
  }
  
  next();
});

// Generate invoice number
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
