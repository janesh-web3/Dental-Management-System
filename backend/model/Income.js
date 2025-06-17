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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Income", incomeSchema); 