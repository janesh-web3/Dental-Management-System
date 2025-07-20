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
    // Enhanced scheduling fields
    appointmentDate: {
      type: String,
      required: [true, "Appointment Date Is Required!"],
    },
    appointmentTime: {
      type: String,
      required: [true, "Appointment Time Is Required!"],
    },
    // New calendar-specific fields
    startDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number, // Duration in minutes
      default: 30,
    },
    timeSlot: {
      start: { type: String }, // e.g., "09:00"
      end: { type: String },   // e.g., "09:30"
    },
    // Treatment and priority fields
    treatmentType: {
      type: String,
      enum: [
        "Cleaning", 
        "Extraction", 
        "Root Canal", 
        "Filling", 
        "Crown", 
        "Bridge", 
        "Implant", 
        "Orthodontics",
        "Whitening",
        "Consultation",
        "Emergency",
        "Follow-up",
        "Other"
      ],
      default: "Consultation",
    },
    priority: {
      type: String,
      enum: ["urgent", "standard", "low"],
      default: "standard",
    },
    // Recurring appointment support
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: {
        type: String,
        enum: ["daily", "weekly", "monthly"],
      },
      interval: { type: Number }, // e.g., every 2 weeks
      endDate: { type: Date },
      occurrences: { type: Number },
    },
    parentAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    // Resource management
    chair: {
      type: String,
    },
    room: {
      type: String,
    },
    equipment: [{
      name: { type: String },
      prepared: { type: Boolean, default: false },
    }],
    // Follow-up management
    isFollowUp: {
      type: Boolean,
      default: false,
    },
    previousAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },
    followUpDate: {
      type: Date,
    },
    followUpReason: {
      type: String,
    },
    // Enhanced status and notifications
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: {
      type: Date,
    },
    noShowCount: {
      type: Number,
      default: 0,
    },
    // Billing integration
    estimatedCost: {
      type: Number,
    },
    actualCost: {
      type: Number,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "unpaid"],
      default: "pending",
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
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
    // Internal notes for staff
    internalNotes: {
      type: String,
    },
    // Tasks for staff preparation
    tasks: [{
      description: { type: String },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      completed: { type: Boolean, default: false },
      completedAt: { type: Date },
    }],
    hasVisited: {
      type: Boolean,
      default: false,
    },
    patientId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected", "Completed", "Cancelled", "No-Show", "Rescheduled"],
      default: "Pending",
    },
    isCreated : {
      type : Date,
      default : Date.now()
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
  { timestamps: true }
);

// Pre-save middleware to automatically set startDateTime and endDateTime
appointmentSchema.pre('save', function(next) {
  // If we have appointmentDate and appointmentTime, create proper DateTime objects
  if (this.appointmentDate && this.appointmentTime && (!this.startDateTime || !this.endDateTime)) {
    const dateStr = this.appointmentDate;
    const timeStr = this.appointmentTime;
    
    // Create start date/time
    const startDateTime = new Date(`${dateStr}T${timeStr}`);
    this.startDateTime = startDateTime;
    
    // Calculate end date/time based on duration
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + (this.duration || 30));
    this.endDateTime = endDateTime;
    
    // Set timeSlot for easy reference
    this.timeSlot = {
      start: timeStr,
      end: endDateTime.toTimeString().slice(0, 5)
    };
  }
  
  next();
});

// Instance method to check for scheduling conflicts
appointmentSchema.methods.checkConflicts = async function() {
  const Appointment = this.constructor;
  
  const conflicts = await Appointment.find({
    _id: { $ne: this._id },
    doctor: this.doctor,
    startDateTime: { $lt: this.endDateTime },
    endDateTime: { $gt: this.startDateTime },
    status: { $nin: ['Cancelled', 'Rejected'] },
    isDeleted: false
  });
  
  return conflicts;
};

// Instance method to create follow-up appointment
appointmentSchema.methods.createFollowUp = async function(followUpData) {
  const Appointment = this.constructor;
  
  const followUpAppointment = new Appointment({
    ...followUpData,
    isFollowUp: true,
    previousAppointmentId: this._id,
    patientId: this.patientId,
    doctor: this.doctor,
  });
  
  return await followUpAppointment.save();
};

// Static method to get availability for a doctor on a specific date
appointmentSchema.statics.getDoctorAvailability = async function(doctorId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const appointments = await this.find({
    doctor: doctorId,
    startDateTime: { $gte: startOfDay, $lte: endOfDay },
    status: { $nin: ['Cancelled', 'Rejected'] },
    isDeleted: false
  }).sort({ startDateTime: 1 });
  
  return appointments;
};

// Virtual for full patient name
appointmentSchema.virtual('patientName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for appointment duration in hours
appointmentSchema.virtual('durationHours').get(function() {
  return this.duration / 60;
});

// Ensure virtual fields are serialized
appointmentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
