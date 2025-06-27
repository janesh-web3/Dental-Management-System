const mongoose = require("mongoose");

// Schema for one-time service payments
const servicePaymentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
    },
    patientName: {
      type: String,
      required: [true, "Patient name is required"]
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
    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      enum: [
        "X-Ray",
        "Consultation",
        "Medicine",
        "Lab Test",
        "Cleaning",
        "Other"
      ]
    },
    description: {
      type: String,
      trim: true
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"]
    },
    paymentMethod: { 
      type: String,
      enum: ["Cash", "Credit Card", "Debit Card", "Insurance", "Bank Transfer", "Other"],
      default: "Cash"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Modified: removed required: true to make it optional
    },
    date: {
      type: Date,
      default: Date.now
    },
    isWalkIn: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to set isWalkIn flag if no patient ID is provided
servicePaymentSchema.pre('save', function(next) {
  // Check if patient field is null, undefined, or empty string
  if (!this.patient || this.patient === '' || this.patient === null) {
    this.isWalkIn = true;
  } else {
    // Ensure isWalkIn is false when patient ID is provided
    this.isWalkIn = false;
  }
  next();
});

module.exports = mongoose.model("ServicePayment", servicePaymentSchema);