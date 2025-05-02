const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  age: {
    type: String,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  nmcNumber: {
    type: String,
  },
  address: {
    type: String,
  },
  specialization: {
    type: String,
  },
  qualifications: {
    type: [String],
  },
  experienceYears: {
    type: String,
    min: 0,
  },
  totalPatients: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }],
  },
  totalPatientChecked: {
    type: Number,
    default: 0,
  },
  totalRating: {
    type: String,
    default: "9.8",
  },
  image: {
    type: String,
    default: "no-photo.jpg",
  },
  description: {
    type: String,
  },
  availability: [
    {
      day: {
        type: String,
        enum: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
      },
      startTime: {
        type: String,
      },
      endTime: {
        type: String,
      },
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  appointments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  reviews: [
    {
      user: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      feedback: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

doctorSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

doctorSchema.methods.calculateAverageRating = function () {
  if (this.reviews.length === 0) return 0;
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / this.reviews.length).toFixed(1);
};

module.exports = mongoose.model("Doctor", doctorSchema);
