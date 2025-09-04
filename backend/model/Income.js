const mongoose = require("mongoose");

const incomeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Income title is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Patient Registration",
        "Consultation Fee",
        "Treatment Fee",
        "X-ray Fee",
        "Dental Products",
        "Other"
      ]
    },
    notes: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "E-sewa", "Khalti", "Credit Card", "Debit Card", "Other"],
      default: "Cash"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
  }
);

module.exports = mongoose.model("Income", incomeSchema); 