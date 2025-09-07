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
    enum: ["superadmin", "admin", "staff", "dentist", "doctor", "reception"],
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
      // Popup management permissions
      popups: {
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        schedule: { type: Boolean, default: false },
        activate: { type: Boolean, default: false },
        deactivate: { type: Boolean, default: false },
      },
      // System administration
      system: {
        fullAccess: { type: Boolean, default: false },
        userManagement: { type: Boolean, default: false },
        systemConfig: { type: Boolean, default: false },
        backupRestore: { type: Boolean, default: false },
      },
    },
    default: function() {
      if (this.role === 'superadmin') {
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
          popups: { create: true, read: true, update: true, delete: true, schedule: true, activate: true, deactivate: true },
          system: { fullAccess: true, userManagement: true, systemConfig: true, backupRestore: true },
        };
      } else if (this.role === 'admin') {
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
          popups: { create: true, read: true, update: true, delete: true, schedule: true, activate: true, deactivate: true },
          system: { fullAccess: false, userManagement: false, systemConfig: false, backupRestore: false },
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
          popups: { create: false, read: false, update: false, delete: false, schedule: false, activate: false, deactivate: false },
          system: { fullAccess: false, userManagement: false, systemConfig: false, backupRestore: false },
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
    if (this.role === 'superadmin') {
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
        popups: { create: true, read: true, update: true, delete: true, schedule: true, activate: true, deactivate: true },
        system: { fullAccess: true, userManagement: true, systemConfig: true, backupRestore: true },
      };
    } else if (this.role === 'admin') {
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
        popups: { create: true, read: true, update: true, delete: true, schedule: true, activate: true, deactivate: true },
        system: { fullAccess: false, userManagement: false, systemConfig: false, backupRestore: false },
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
        popups: { create: false, read: false, update: false, delete: false, schedule: false, activate: false, deactivate: false },
        system: { fullAccess: false, userManagement: false, systemConfig: false, backupRestore: false },
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

// Instance method to check if user is superadmin
userSchema.methods.isSuperAdmin = function() {
  return this.role === 'superadmin';
};

// Instance method to check if user is admin
userSchema.methods.isAdmin = function() {
  return this.role === 'admin';
};

// Instance method to check if user is admin or superadmin
userSchema.methods.isAdminOrSuperAdmin = function() {
  return this.role === 'admin' || this.role === 'superadmin';
};

// Instance method to check if user is staff
userSchema.methods.isStaff = function() {
  return this.role === 'staff';
};

module.exports = mongoose.model("User", userSchema);
