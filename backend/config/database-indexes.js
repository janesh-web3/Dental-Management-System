const mongoose = require('mongoose');

/**
 * Database Performance Optimization - Index Creation
 * This script creates essential indexes for improved query performance
 */

const createIndexes = async () => {
  try {
    console.log('🚀 Creating database indexes for performance optimization...');

    // Patient Collection Indexes
    const Patient = mongoose.model('Patient');
    
    // Search indexes for patient lookup
    await Patient.collection.createIndex({
      'personalDetails.name': 'text',
      'personalDetails.contactNumber': 'text',
      'personalDetails.emailAddress': 'text'
    }, { name: 'patient_search_text' });

    // Individual field indexes for exact matches
    await Patient.collection.createIndex({ 'personalDetails.contactNumber': 1 });
    await Patient.collection.createIndex({ 'personalDetails.emailAddress': 1 });
    await Patient.collection.createIndex({ 'personalDetails.gender': 1 });
    await Patient.collection.createIndex({ 'personalDetails.address': 1 });
    
    // Date-based indexes
    await Patient.collection.createIndex({ createdAt: -1 });
    await Patient.collection.createIndex({ updatedAt: -1 });
    
    // Medical details indexes
    await Patient.collection.createIndex({ 'medicalDetails.group': 1 });
    await Patient.collection.createIndex({ 'medicalDetails.treatmentPlanning.treatmentDate': -1 });
    await Patient.collection.createIndex({ 'medicalDetails.treatmentPlanning.treatedByDoctor': 1 });
    
    // Group treatment indexes
    await Patient.collection.createIndex({ 'medicalDetails.treatmentPlanning.groupTreatmentDetails.groupName': 1 });
    await Patient.collection.createIndex({ 'medicalDetails.treatmentPlanning.groupTreatmentDetails.treatedByDoctor': 1 });
    
    // Follow-up indexes
    await Patient.collection.createIndex({ 'medicalDetails.treatmentPlanning.followUps.date': 1 });
    await Patient.collection.createIndex({ 'medicalDetails.treatmentPlanning.followUps.completed': 1 });
    
    // Compound indexes for common queries
    await Patient.collection.createIndex({ 
      'personalDetails.gender': 1, 
      'medicalDetails.group': 1,
      createdAt: -1 
    });

    // Appointment Collection Indexes
    const Appointment = mongoose.model('Appointment');
    await Appointment.collection.createIndex({ createdAt: -1 });
    await Appointment.collection.createIndex({ appointmentDate: 1 });
    await Appointment.collection.createIndex({ doctor: 1 });
    await Appointment.collection.createIndex({ patient: 1 });
    await Appointment.collection.createIndex({ status: 1 });
    await Appointment.collection.createIndex({ hasVisited: 1 });
    await Appointment.collection.createIndex({ isDeleted: 1 });
    
    // Compound index for analytics queries
    await Appointment.collection.createIndex({ 
      createdAt: -1, 
      isDeleted: 1, 
      status: 1 
    });

    // Doctor Collection Indexes
    const Doctor = mongoose.model('Doctor');
    await Doctor.collection.createIndex({ name: 1 });
    await Doctor.collection.createIndex({ email: 1 });
    await Doctor.collection.createIndex({ isActive: 1 });

    // SMS History Indexes
    const SMSHistory = mongoose.model('SMSHistory');
    await SMSHistory.collection.createIndex({ createdAt: -1 });
    await SMSHistory.collection.createIndex({ status: 1 });
    await SMSHistory.collection.createIndex({ recipient: 1 });
    await SMSHistory.collection.createIndex({ messageId: 1 });
    await SMSHistory.collection.createIndex({ patient: 1 });
    
    // Service Payment Indexes
    const ServicePayment = mongoose.model('ServicePayment');
    await ServicePayment.collection.createIndex({ createdAt: -1 });
    await ServicePayment.collection.createIndex({ patient: 1 });
    await ServicePayment.collection.createIndex({ doctor: 1 });
    await ServicePayment.collection.createIndex({ paymentMethod: 1 });
    await ServicePayment.collection.createIndex({ status: 1 });
    
    // Compound index for financial analytics
    await ServicePayment.collection.createIndex({ 
      createdAt: -1, 
      status: 1,
      paymentMethod: 1 
    });

    // User Collection Indexes
    const User = mongoose.model('User');
    await User.collection.createIndex({ email: 1 });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ isActive: 1 });

    console.log('✅ Database indexes created successfully!');
    
    // Log index statistics
    const collections = ['patients', 'appointments', 'doctors', 'smshistories', 'servicepayments', 'users'];
    for (const collectionName of collections) {
      try {
        const indexes = await mongoose.connection.db.collection(collectionName).indexes();
        console.log(`📊 ${collectionName}: ${indexes.length} indexes`);
      } catch (error) {
        console.log(`⚠️  Collection ${collectionName} not found or error getting indexes`);
      }
    }

  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
    throw error;
  }
};

module.exports = { createIndexes };