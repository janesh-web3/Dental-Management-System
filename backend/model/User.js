const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name Is Required!"],
    minLength: [3, "Name Must Contain At Least 3 Characters!"],
  },
  email: {
    type: String,
    required: [true, "Email Is Required!"],
    validate: [validator.isEmail, "Provide A Valid Email!"],
    unique: true,
  },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "staff", "dentist", "doctor", "reception"],
    default: "staff",
    required: true,
  },
  contact: { type: String },
  permissions: {
    type: {
      // Dashboard permissions
      dashboard: {
        fullAccess: { type: Boolean, default: false },
        basicAccess: { type: Boolean, default: true },
        analytics: { type: Boolean, default: false },
        reports: { type: Boolean, default: false },
      },
      // User management permissions
      users: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      // Entity permissions
      patients: {
        create: { type: Boolean, default: true },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: true },
        delete: { type: Boolean, default: false },
      },
      doctors: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      appointments: {
        create: { type: Boolean, default: true },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: true },
        delete: { type: Boolean, default: false },
      },
      income: {
        create: { type: Boolean, default: true },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: true },
        delete: { type: Boolean, default: false },
      },
      expenses: {
        create: { type: Boolean, default: true },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: true },
        delete: { type: Boolean, default: false },
      },
      contacts: {
        create: { type: Boolean, default: true },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: true },
        delete: { type: Boolean, default: false },
      },
      // System permissions
      settings: {
        access: { type: Boolean, default: false },
        configure: { type: Boolean, default: false },
      },
    },
    default: function() {
      if (this.role === 'admin') {
        return {
          dashboard: { fullAccess: true, basicAccess: true, analytics: true, reports: true },
          users: { create: true, read: true, update: true, delete: true },
          patients: { create: true, read: true, update: true, delete: true },
          doctors: { create: true, read: true, update: true, delete: true },
          appointments: { create: true, read: true, update: true, delete: true },
          income: { create: true, read: true, update: true, delete: true },
          expenses: { create: true, read: true, update: true, delete: true },
          contacts: { create: true, read: true, update: true, delete: true },
          settings: { access: true, configure: true },
        };
      } else {
        return {
          dashboard: { fullAccess: false, basicAccess: true, analytics: false, reports: false },
          users: { create: false, read: false, update: false, delete: false },
          patients: { create: true, read: true, update: true, delete: false },
          doctors: { create: false, read: true, update: false, delete: false },
          appointments: { create: true, read: true, update: true, delete: false },
          income: { create: true, read: true, update: true, delete: false },
          expenses: { create: true, read: true, update: true, delete: false },
          contacts: { create: true, read: true, update: true, delete: false },
          settings: { access: false, configure: false },
        };
      }
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to set permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('role') || this.isNew) {
    if (this.role === 'admin') {
      this.permissions = {
        dashboard: { fullAccess: true, basicAccess: true, analytics: true, reports: true },
        users: { create: true, read: true, update: true, delete: true },
        patients: { create: true, read: true, update: true, delete: true },
        doctors: { create: true, read: true, update: true, delete: true },
        appointments: { create: true, read: true, update: true, delete: true },
        income: { create: true, read: true, update: true, delete: true },
        expenses: { create: true, read: true, update: true, delete: true },
        contacts: { create: true, read: true, update: true, delete: true },
        settings: { access: true, configure: true },
      };
    } else {
      this.permissions = {
        dashboard: { fullAccess: false, basicAccess: true, analytics: false, reports: false },
        users: { create: false, read: false, update: false, delete: false },
        patients: { create: true, read: true, update: true, delete: false },
        doctors: { create: false, read: true, update: false, delete: false },
        appointments: { create: true, read: true, update: true, delete: false },
        income: { create: true, read: true, update: true, delete: false },
        expenses: { create: true, read: true, update: true, delete: false },
        contacts: { create: true, read: true, update: true, delete: false },
        settings: { access: false, configure: false },
      };
    }
  }
  
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  
  next();
});

// Instance method to check permissions
userSchema.methods.hasPermission = function(entity, action) {
  if (!this.permissions || !this.permissions[entity]) {
    return false;
  }
  return this.permissions[entity][action] || false;
};

// Instance method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Instance method to check if user is staff
userSchema.methods.isStaff = function() {
  return this.role === 'staff';
};

module.exports = mongoose.model("User", userSchema);
