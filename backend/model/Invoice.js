const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema(
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
    invoiceNumber: { 
      type: String,
      required: true,
      unique: true
    },
    invoiceDate: { 
      type: Date,
      default: Date.now 
    },
    dueDate: { 
      type: Date,
      required: true 
    },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    balance: { type: Number, required: true },
    status: { 
      type: String, 
      enum: ["Draft", "Sent", "Paid", "Partially Paid", "Overdue", "Cancelled"],
      default: "Draft"
    },
    paymentMethod: { 
      type: String,
      enum: ["Cash", "Credit Card", "Debit Card", "Insurance", "Bank Transfer", "Other"],
      default: "Cash"
    },
    notes: { type: String },
    treatmentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TreatmentPlan"
    }
  },
  { timestamps: true }
);

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
