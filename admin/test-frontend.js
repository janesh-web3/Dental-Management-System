#!/usr/bin/env node

/**
 * Comprehensive Frontend Feature Testing Script
 * 
 * This script tests all frontend features with sample data:
 * 1. Patient CRUD operations
 * 2. Doctor CRUD operations  
 * 3. Finance operations (Income, Expense, Service Payment)
 * 4. Recycle Bin functionality
 * 5. Invoice generation
 * 6. Authentication flows
 * 7. Registration advance payment
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8080';
const TEST_PREFIX = 'FRONTEND_TEST_';

class FrontendTester {
  constructor() {
    this.adminToken = null;
    this.doctorToken = null;
    this.patientToken = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    };
    this.createdEntities = {
      patients: [],
      doctors: [],
      incomes: [],
      expenses: [],
      servicePayments: [],
      appointments: [],
      invoices: []
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
      this.testResults.passed++;
      this.testResults.tests.push({ name, status: 'PASSED' });
      this.log(`✅ PASSED: ${name}`, 'success');
    } catch (error) {
      this.testResults.failed++;
      this.testResults.tests.push({ name, status: 'FAILED', error: error.message });
      this.log(`❌ FAILED: ${name} - ${error.message}`, 'error');
    }
  }

  async makeRequest(method, endpoint, data = null, token = null) {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw new Error(`${method} ${endpoint}: ${error.response?.data?.message || error.message}`);
    }
  }

  // Authentication Tests
  async testAdminLogin() {
    const loginData = {
      contact: "9841234567", // Default admin contact
      password: "admin123"
    };

    const response = await this.makeRequest('POST', '/user/login', loginData);
    if (!response.token) {
      throw new Error('No token received from admin login');
    }

    this.adminToken = response.token;
    this.log(`Admin login successful, token: ${this.adminToken.substring(0, 20)}...`);
  }

  // Patient CRUD Tests
  async testPatientCreation() {
    const patientData = {
      personalDetails: {
        name: `${TEST_PREFIX}Patient_John_Doe`,
        contactNumber: "9876543210",
        gender: "Male",
        age: "30",
        address: "Test Address 123",
        emailAddress: "test.patient@example.com",
        checkUpDate: new Date().toISOString().split('T')[0]
      },
      medicalDetails: {
        chiefComplaint: "Tooth pain",
        diagnosis: "Dental caries",
        investigation: {
          blood: "Normal",
          xray: "Shows cavity"
        },
        group: "General",
        medicalHistory: {
          bloodPressure: "120/80",
          diabetes: false,
          noMedicalIssues: true
        },
        treatmentPlanning: []
      },
      registrationAdvance: {
        amount: 1000,
        paymentMethod: "Cash"
      }
    };

    const response = await this.makeRequest('POST', '/patient/add-patient', patientData, this.adminToken);
    if (!response.data || !response.data._id) {
      throw new Error('Patient creation failed - no ID returned');
    }

    this.createdEntities.patients.push(response.data._id);
    this.log(`Patient created with ID: ${response.data._id}`);
  }

  async testPatientUpdate() {
    if (this.createdEntities.patients.length === 0) {
      throw new Error('No patients available for update test');
    }

    const patientId = this.createdEntities.patients[0];
    const updateData = {
      personalDetails: {
        name: `${TEST_PREFIX}Patient_John_Doe_Updated`,
        contactNumber: "9876543210",
        gender: "Male",
        age: "31",
        address: "Updated Address 456"
      }
    };

    await this.makeRequest('PUT', `/patient/update-patient/${patientId}`, updateData, this.adminToken);
    this.log(`Patient ${patientId} updated successfully`);
  }

  async testPatientSoftDelete() {
    if (this.createdEntities.patients.length === 0) {
      throw new Error('No patients available for delete test');
    }

    const patientId = this.createdEntities.patients[0];
    await this.makeRequest('DELETE', `/patient/delete-patient/${patientId}`, null, this.adminToken);
    this.log(`Patient ${patientId} soft deleted successfully`);
  }

  // Doctor CRUD Tests
  async testDoctorCreation() {
    const doctorData = {
      name: `${TEST_PREFIX}Dr_Jane_Smith`,
      email: "test.doctor@example.com",
      password: "doctor123",
      contactNumber: "9876543211",
      specialization: "General Dentistry",
      qualifications: ["BDS", "MDS"],
      experienceYears: "5"
    };

    const response = await this.makeRequest('POST', '/doctor/add-doctor', doctorData, this.adminToken);
    if (!response._id) {
      throw new Error('Doctor creation failed - no ID returned');
    }

    this.createdEntities.doctors.push(response._id);
    this.log(`Doctor created with ID: ${response._id}`);
  }

  async testDoctorSoftDelete() {
    if (this.createdEntities.doctors.length === 0) {
      throw new Error('No doctors available for delete test');
    }

    const doctorId = this.createdEntities.doctors[0];
    await this.makeRequest('DELETE', `/doctor/delete-doctor/${doctorId}`, null, this.adminToken);
    this.log(`Doctor ${doctorId} soft deleted successfully`);
  }

  // Finance Operations Tests
  async testIncomeCreation() {
    const incomeData = {
      title: `${TEST_PREFIX}Test_Income`,
      amount: 5000,
      category: "Consultation Fee",
      notes: "Test income entry"
    };

    const response = await this.makeRequest('POST', '/finance/income', incomeData, this.adminToken);
    if (!response.data || !response.data._id) {
      throw new Error('Income creation failed - no ID returned');
    }

    this.createdEntities.incomes.push(response.data._id);
    this.log(`Income created with ID: ${response.data._id}`);
  }

  async testExpenseCreation() {
    const expenseData = {
      title: `${TEST_PREFIX}Test_Expense`,
      amount: 2000,
      category: "Dental Supplies",
      notes: "Test expense entry"
    };

    const response = await this.makeRequest('POST', '/finance/expense', expenseData, this.adminToken);
    if (!response.data || !response.data._id) {
      throw new Error('Expense creation failed - no ID returned');
    }

    this.createdEntities.expenses.push(response.data._id);
    this.log(`Expense created with ID: ${response.data._id}`);
  }

  async testServicePaymentCreation() {
    const servicePaymentData = {
      patientName: `${TEST_PREFIX}Walk_In_Patient`,
      contactNumber: "9876543212",
      serviceType: "X-Ray",
      description: "Test service payment",
      amount: 500,
      paymentMethod: "Cash",
      isWalkIn: true
    };

    const response = await this.makeRequest('POST', '/service-payment', servicePaymentData, this.adminToken);
    if (!response.data || !response.data._id) {
      throw new Error('Service payment creation failed - no ID returned');
    }

    this.createdEntities.servicePayments.push(response.data._id);
    this.log(`Service payment created with ID: ${response.data._id}`);
  }

  async testFinanceSoftDeletes() {
    // Test income soft delete
    if (this.createdEntities.incomes.length > 0) {
      const incomeId = this.createdEntities.incomes[0];
      await this.makeRequest('DELETE', `/finance/income/${incomeId}`, null, this.adminToken);
      this.log(`Income ${incomeId} soft deleted successfully`);
    }

    // Test expense soft delete
    if (this.createdEntities.expenses.length > 0) {
      const expenseId = this.createdEntities.expenses[0];
      await this.makeRequest('DELETE', `/finance/expense/${expenseId}`, null, this.adminToken);
      this.log(`Expense ${expenseId} soft deleted successfully`);
    }

    // Test service payment soft delete
    if (this.createdEntities.servicePayments.length > 0) {
      const servicePaymentId = this.createdEntities.servicePayments[0];
      await this.makeRequest('DELETE', `/service-payment/${servicePaymentId}`, null, this.adminToken);
      this.log(`Service payment ${servicePaymentId} soft deleted successfully`);
    }
  }

  // Recycle Bin Tests
  async testRecycleBinView() {
    const response = await this.makeRequest('GET', '/recycle-bin?type=all', null, this.adminToken);
    if (!response.success) {
      throw new Error('Failed to fetch recycle bin items');
    }

    this.log(`Recycle bin contains items: ${JSON.stringify(Object.keys(response.data))}`);
  }

  async testRecycleBinStats() {
    const response = await this.makeRequest('GET', '/recycle-bin/stats', null, this.adminToken);
    if (!response.success) {
      throw new Error('Failed to fetch recycle bin stats');
    }

    this.log(`Recycle bin stats: Total=${response.data.total}, Breakdown=${JSON.stringify(response.data.breakdown)}`);
  }

  async testRecycleBinRestore() {
    // Try to restore the first deleted patient
    if (this.createdEntities.patients.length > 0) {
      const patientId = this.createdEntities.patients[0];
      const response = await this.makeRequest('PUT', `/recycle-bin/restore/patient/${patientId}`, null, this.adminToken);
      if (!response.success) {
        throw new Error('Failed to restore patient from recycle bin');
      }
      this.log(`Patient ${patientId} restored from recycle bin`);
    }
  }

  // Invoice Generation Tests
  async testInvoiceGeneration() {
    // Check if invoices were generated during our tests
    const response = await this.makeRequest('GET', '/v1/invoices?page=1&limit=10', null, this.adminToken);
    if (!response.success) {
      throw new Error('Failed to fetch invoices');
    }

    const testInvoices = response.data.filter(invoice => 
      invoice.patientName && invoice.patientName.includes(TEST_PREFIX)
    );

    if (testInvoices.length === 0) {
      throw new Error('No test invoices found - automatic generation may have failed');
    }

    this.log(`Found ${testInvoices.length} automatically generated test invoices`);
    testInvoices.forEach(invoice => {
      this.log(`  - Invoice ${invoice.invoiceNumber}: ${invoice.patientName} - $${invoice.total}`);
    });
  }

  // Financial Summary Tests
  async testFinancialSummary() {
    const response = await this.makeRequest('GET', '/finance/summary', null, this.adminToken);
    if (!response.success) {
      throw new Error('Failed to fetch financial summary');
    }

    this.log(`Financial summary: Revenue=${response.data.totalRevenue}, Due=${response.data.totalDue}`);
  }

  // Authentication Token Tests
  async testTokenValidation() {
    // Test admin token
    const adminResponse = await this.makeRequest('GET', '/patient/get-patients?page=1&limit=5', null, this.adminToken);
    if (!adminResponse.success) {
      throw new Error('Admin token validation failed');
    }

    this.log('Admin token validation successful');
  }

  // Cleanup
  async cleanup() {
    this.log('Starting cleanup of test data...');
    
    try {
      // Note: We don't need to clean up much since we're using soft deletes
      // The backend test cleanup will handle the database cleanup
      this.log('Cleanup completed (soft deletes used)');
    } catch (error) {
      this.log(`Cleanup warning: ${error.message}`);
    }
  }

  // Main test runner
  async runAllTests() {
    this.log('🚀 Starting Frontend Feature Tests');

    try {
      // Authentication
      await this.test('Admin Login', () => this.testAdminLogin());
      await this.test('Token Validation', () => this.testTokenValidation());

      // Patient CRUD
      await this.test('Patient Creation (with Registration Advance)', () => this.testPatientCreation());
      await this.test('Patient Update', () => this.testPatientUpdate());
      await this.test('Patient Soft Delete', () => this.testPatientSoftDelete());

      // Doctor CRUD
      await this.test('Doctor Creation', () => this.testDoctorCreation());
      await this.test('Doctor Soft Delete', () => this.testDoctorSoftDelete());

      // Finance Operations
      await this.test('Income Creation', () => this.testIncomeCreation());
      await this.test('Expense Creation', () => this.testExpenseCreation());
      await this.test('Service Payment Creation', () => this.testServicePaymentCreation());
      await this.test('Finance Soft Deletes', () => this.testFinanceSoftDeletes());

      // Recycle Bin
      await this.test('Recycle Bin View', () => this.testRecycleBinView());
      await this.test('Recycle Bin Stats', () => this.testRecycleBinStats());
      await this.test('Recycle Bin Restore', () => this.testRecycleBinRestore());

      // Invoice and Financial
      await this.test('Invoice Generation Check', () => this.testInvoiceGeneration());
      await this.test('Financial Summary', () => this.testFinancialSummary());

      await this.cleanup();

      // Print results
      this.log('\n📊 FRONTEND TEST RESULTS:');
      this.log(`✅ Passed: ${this.testResults.passed}`);
      this.log(`❌ Failed: ${this.testResults.failed}`);
      this.log(`📋 Total:  ${this.testResults.tests.length}`);

      if (this.testResults.failed > 0) {
        this.log('\n❌ FAILED TESTS:');
        this.testResults.tests
          .filter(t => t.status === 'FAILED')
          .forEach(t => this.log(`  - ${t.name}: ${t.error}`));
      }

      this.log(this.testResults.failed === 0 ? '\n🎉 ALL FRONTEND TESTS PASSED!' : '\n⚠️  SOME FRONTEND TESTS FAILED');

    } catch (error) {
      this.log(`💥 Test runner failed: ${error.message}`, 'error');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new FrontendTester();
  tester.runAllTests().catch(error => {
    console.error('💥 Frontend test runner failed:', error);
    process.exit(1);
  });
}

module.exports = FrontendTester;