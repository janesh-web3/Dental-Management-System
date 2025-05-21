const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    required: true,
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

doctorSchema.pre("save", async function (next) {
  this.updatedAt = Date.now();
  
  // Only hash the password if it has been modified (or is new)
  if (this.isModified("password") && this.password) {
    try {
      // Generate a salt
      const salt = await bcrypt.genSalt(10);
      // Hash the password along with the new salt
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Method to compare password for login
doctorSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

doctorSchema.methods.calculateAverageRating = function () {
  if (this.reviews.length === 0) return 0;
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / this.reviews.length).toFixed(1);
};

module.exports = mongoose.model("Doctor", doctorSchema);
