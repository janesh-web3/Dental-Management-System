const mongoose = require('mongoose');

const paymentLogSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    index: true
  },
  amount: { 
    type: Number, 
    required: true 
  },
  paymentDate: { 
    type: Date, 
    default: Date.now 
  },
  paymentMethod: { 
    type: String,
    required: true,
    enum: ["Cash", "Credit Card", "Debit Card", "Insurance", "Bank Transfer", "Other"]
  },
  transactionId: String,
  notes: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ["Completed", "Pending", "Failed", "Refunded"],
    default: "Completed"
  },
  // For partial payments
  isPartial: {
    type: Boolean,
    default: false
  },
  // For tracking refunds
  isRefund: {
    type: Boolean,
    default: false
  },
  refundedAmount: {
    type: Number,
    default: 0
  },
  refundReason: String
}, {
  timestamps: true
});

// Add indexes for better query performance
paymentLogSchema.index({ invoice: 1, paymentDate: -1 });
paymentLogSchema.index({ paymentDate: -1 });
paymentLogSchema.index({ processedBy: 1 });
paymentLogSchema.index({ status: 1 });

module.exports = mongoose.model('PaymentLog', paymentLogSchema);
