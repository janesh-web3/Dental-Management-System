const mongoose = require("mongoose");
const validator = require("validator");

const appointmentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First Name Is Required!"],
      minLength: [3, "First Name Must Contain At Least 3 Characters!"],
    },
    lastName: {
      type: String,
      required: [true, "Last Name Is Required!"],
      minLength: [3, "Last Name Must Contain At Least 3 Characters!"],
    },
    age: {
      type: String,
      required: [true, "Age Is Required!"],
    },
    address: {
      type: String,
      required: [true, "Address Is Required!"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone Is Required!"],
      minLength: [10, "Phone Number Must Contain Exact 10 Digits!"],
      maxLength: [10, "Phone Number Must Contain Exact 10 Digits!"],
    },
    gender: {
      type: String,
      required: [true, "Gender Is Required!"],
      enum: ["Male", "Female", "Other"],
    },
    appointmentDate: {
      type: String,
      required: [true, "Appointment Date Is Required!"],
    },
    appointmentTime: {
      type: String,
      required: [true, "Appointment Time Is Required!"],
    },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    subject: {
      type: String,
      required: [true, "Subject Is Required!"],
    },
    reason: {
      type: String,
      required: [true, "Appointment Reason Is Required!"],
    },
    comments: {
      type: String,
    },
    hasVisited: {
      type: Boolean,
      default: false,
    },
    patientId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected" ,"Completed", "Cancelled"],
      default: "Pending",
    },
    isCreated : {
      type : Date,
      default : Date.now()
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
