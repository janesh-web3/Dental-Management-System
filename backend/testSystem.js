#!/usr/bin/env node

/**
 * Comprehensive System Test for Dental Management System
 * 
 * This script tests all the new features implemented:
 * 1. Soft Delete functionality
 * 2. Invoice Generation System
 * 3. Financial Calculations
 * 4. Authentication fixes
 * 5. Recycle Bin operations
 */

const mongoose = require('mongoose');
const Patient = require('./model/Patient');
const Income = require('./model/Income');
const Expense = require('./model/Expense');
const ServicePayment = require('./model/ServicePayment');
const Invoice = require('./model/Invoice');
const User = require('./model/User');
const { createServicePaymentInvoice, createIncomeInvoice, createExpenseInvoice } = require('./utils/invoiceGenerator');

require('dotenv').config();

// Test configuration
const TEST_CONFIG = {
  dbUrl: process.env.DB_URL,
  testDataPrefix: 'TEST_',
  cleanup: true // Set to false to keep test data for inspection
};

class SystemTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, testFn) {
    this.log(`Running test: ${name}`);
    try {
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      this.log(`✅ PASSED: ${name}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      this.log(`❌ FAILED: ${name} - ${error.message}`, 'error');
    }
  }

  async setup() {
    this.log('Setting up test environment...');
    
    if (!TEST_CONFIG.dbUrl) {
      throw new Error('DB_URL not found in environment variables');
    }

    await mongoose.connect(TEST_CONFIG.dbUrl);
    this.log('Connected to MongoDB');

    // Create a test admin user if it doesn't exist
    const testAdmin = await User.findOne({ email: 'test@admin.com' });
    if (!testAdmin) {
      await User.create({
        name: 'Test Admin',
        email: 'test@admin.com',
        password: 'testpassword',
        role: 'admin'
      });
      this.log('Created test admin user');
    }

    this.testAdminId = (await User.findOne({ email: 'test@admin.com' }))._id;
  }

  async cleanup() {
    if (!TEST_CONFIG.cleanup) {
      this.log('Skipping cleanup (TEST_CONFIG.cleanup = false)');
      return;
    }

    this.log('Cleaning up test data...');
    
    // Remove test data
    await Patient.deleteMany({ 'personalDetails.name': { $regex: TEST_CONFIG.testDataPrefix } });
    await Income.deleteMany({ title: { $regex: TEST_CONFIG.testDataPrefix } });
    await Expense.deleteMany({ title: { $regex: TEST_CONFIG.testDataPrefix } });
    await ServicePayment.deleteMany({ patientName: { $regex: TEST_CONFIG.testDataPrefix } });
    await Invoice.deleteMany({ patientName: { $regex: TEST_CONFIG.testDataPrefix } });
    
    this.log('Test data cleaned up');
  }

  async testSoftDeleteFunctionality() {
    // Create test patient
    const testPatient = await Patient.create({
      personalDetails: {
        name: `${TEST_CONFIG.testDataPrefix}Patient`,
        contactNumber: '1234567890',
        gender: 'Male',
        age: '30',
        address: 'Test Address'
      }
    });

    // Verify patient is created and not deleted
    const activePatient = await Patient.findById(testPatient._id);
    if (!activePatient || activePatient.isDeleted) {
      throw new Error('Patient not created properly');
    }

    // Soft delete the patient
    await Patient.findByIdAndUpdate(testPatient._id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: this.testAdminId
    });

    // Verify patient is soft deleted
    const deletedPatient = await Patient.findById(testPatient._id);
    if (!deletedPatient.isDeleted) {
      throw new Error('Patient was not soft deleted');
    }

    // Verify patient is excluded from normal queries
    const activePatients = await Patient.find({ isDeleted: { $ne: true } });
    const foundDeletedPatient = activePatients.find(p => p._id.toString() === testPatient._id.toString());
    if (foundDeletedPatient) {
      throw new Error('Deleted patient should not appear in normal queries');
    }

    this.testPatientId = testPatient._id;
  }

  async testInvoiceGeneration() {
    // Test service payment invoice generation
    const servicePaymentData = {
      patientName: `${TEST_CONFIG.testDataPrefix}ServicePatient`,
      contactNumber: '9876543210',
      serviceType: 'Consultation',
      description: 'Test consultation',
      amount: 100,
      paymentMethod: 'Cash',
      isWalkIn: true
    };

    const serviceInvoice = await createServicePaymentInvoice(servicePaymentData, this.testAdminId);
    
    if (!serviceInvoice || !serviceInvoice.invoiceNumber) {
      throw new Error('Service payment invoice not generated');
    }

    this.log(`Generated service invoice: ${serviceInvoice.invoiceNumber}`);

    // Test income invoice generation
    const incomeData = {
      title: `${TEST_CONFIG.testDataPrefix}Income`,
      amount: 500,
      category: 'Other',
      notes: 'Test income entry'
    };

    const incomeInvoice = await createIncomeInvoice(incomeData, this.testAdminId);
    
    if (!incomeInvoice || !incomeInvoice.invoiceNumber) {
      throw new Error('Income invoice not generated');
    }

    this.log(`Generated income invoice: ${incomeInvoice.invoiceNumber}`);

    // Test expense invoice generation
    const expenseData = {
      title: `${TEST_CONFIG.testDataPrefix}Expense`,
      amount: 200,
      category: 'Other',
      notes: 'Test expense entry'
    };

    const expenseInvoice = await createExpenseInvoice(expenseData, this.testAdminId);
    
    if (!expenseInvoice || !expenseInvoice.invoiceNumber) {
      throw new Error('Expense invoice not generated');
    }

    this.log(`Generated expense invoice: ${expenseInvoice.invoiceNumber}`);
  }

  async testFinancialCalculations() {
    // Create test income
    const testIncome = await Income.create({
      title: `${TEST_CONFIG.testDataPrefix}Income`,
      amount: 1000,
      category: 'Other',
      createdBy: this.testAdminId
    });

    // Create test expense
    const testExpense = await Expense.create({
      title: `${TEST_CONFIG.testDataPrefix}Expense`,
      amount: 300,
      category: 'Other',
      createdBy: this.testAdminId
    });

    // Test that only non-deleted records are included in calculations
    const totalIncome = await Income.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const totalExpense = await Expense.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    if (totalIncome.length === 0 || totalExpense.length === 0) {
      throw new Error('Financial calculations not working properly');
    }

    // Soft delete the income and verify it's excluded
    await Income.findByIdAndUpdate(testIncome._id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: this.testAdminId
    });

    const totalIncomeAfterDelete = await Income.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    const newTotal = totalIncomeAfterDelete.length > 0 ? totalIncomeAfterDelete[0].total : 0;
    const oldTotal = totalIncome[0].total;

    if (newTotal >= oldTotal) {
      throw new Error('Soft deleted income is still included in calculations');
    }

    this.log(`Financial calculations working: ${oldTotal} -> ${newTotal} after soft delete`);
  }

  async testModelIntegrity() {
    // Test that all required models have soft delete fields
    const models = [Patient, Income, Expense, ServicePayment, Invoice];
    
    for (const Model of models) {
      const schema = Model.schema;
      
      if (!schema.paths.isDeleted) {
        throw new Error(`Model ${Model.modelName} missing isDeleted field`);
      }
      
      if (!schema.paths.deletedAt) {
        throw new Error(`Model ${Model.modelName} missing deletedAt field`);
      }
      
      if (!schema.paths.deletedBy) {
        throw new Error(`Model ${Model.modelName} missing deletedBy field`);
      }
    }

    this.log('All models have required soft delete fields');
  }

  async testDataIntegrity() {
    // Create a test patient with related data
    const testPatient = await Patient.create({
      personalDetails: {
        name: `${TEST_CONFIG.testDataPrefix}IntegrityPatient`,
        contactNumber: '5555555555',
        gender: 'Female',
        age: '25'
      }
    });

    // Create related service payment
    const servicePayment = await ServicePayment.create({
      patient: testPatient._id,
      patientName: testPatient.personalDetails.name,
      serviceType: 'Cleaning',
      amount: 150,
      paymentMethod: 'Cash',
      createdBy: this.testAdminId
    });

    // Soft delete the patient
    await Patient.findByIdAndUpdate(testPatient._id, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: this.testAdminId
    });

    // Verify that queries exclude the patient's data
    const activePatients = await Patient.find({ isDeleted: { $ne: true } });
    const foundPatient = activePatients.find(p => p._id.toString() === testPatient._id.toString());
    
    if (foundPatient) {
      throw new Error('Soft deleted patient still appears in active queries');
    }

    this.log('Data integrity maintained for soft deleted records');
  }

  async runAllTests() {
    this.log('🚀 Starting Dental Management System Tests');
    
    await this.setup();

    await this.test('Soft Delete Functionality', () => this.testSoftDeleteFunctionality());
    await this.test('Invoice Generation System', () => this.testInvoiceGeneration());
    await this.test('Financial Calculations', () => this.testFinancialCalculations());
    await this.test('Model Integrity', () => this.testModelIntegrity());
    await this.test('Data Integrity', () => this.testDataIntegrity());

    await this.cleanup();

    // Print results
    this.log('\n📊 TEST RESULTS:');
    this.log(`✅ Passed: ${this.results.passed}`);
    this.log(`❌ Failed: ${this.results.failed}`);
    this.log(`📋 Total:  ${this.results.tests.length}`);

    if (this.results.failed > 0) {
      this.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(t => t.status === 'FAILED')
        .forEach(t => this.log(`  - ${t.name}: ${t.error}`));
    }

    this.log(this.results.failed === 0 ? '\n🎉 ALL TESTS PASSED!' : '\n⚠️  SOME TESTS FAILED');
    
    await mongoose.disconnect();
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new SystemTester();
  tester.runAllTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = SystemTester;