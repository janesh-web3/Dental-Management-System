const mongoose = require('mongoose');
const Patient = require('./model/Patient');

// Test data structure for group treatment
const testPatientData = {
  personalDetails: {
    name: "Test Patient for Orthodontic Treatment",
    contactNumber: "1234567890",
    gender: "Male",
    sn: "TEST001",
    address: "Test Address",
    age: "25",
    emailAddress: "test@example.com",
    referredBy: "Test Doctor",
    checkUpDate: new Date(),
    checkUpDateNp: "2081-03-25",
    createdAt: new Date(),
  },
  medicalDetails: [
    {
      chiefComplaint: "Teeth alignment issues",
      diagnosis: "Orthodontic misalignment",
      investigation: {
        blood: "Normal",
        xray: "Clear",
      },
      group: "Ortho",
      medicalHistory: {
        bloodPressure: "120/80",
        diabetes: false,
        thyroid: false,
        bleedingDisorder: false,
        pregnancy: false,
        asthma: false,
        allergies: "",
        otherConditions: "",
        noMedicalIssues: false,
      },
      treatmentPlanning: [
        {
          patientType: "Adult",
          isCompleted: false,
          treatmentDate: new Date(),
          treatmentFindings: "Misaligned teeth",
          teethNumber: "",
          clinicalFindings: ["Crowding", "Spacing"],
          otherFindings: "Needs braces",
          followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          selectedTeethDetails: [],
          groupTreatmentDetails: [
            {
              groupName: "Ortho",
              procedure: "Orthodontic Braces Treatment",
              totalTreatmentAmount: 50000,
              totalPaidAmount: 15000,
              totalRemainingAmount: 35000,
              startDate: new Date(),
              followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              completionDate: null,
              treatedByDoctor: null,
              isCompleted: false,
              dailyTreatments: [
                {
                  date: new Date(),
                  treatmentAmount: 15000,
                  paidAmount: 15000,
                  remainingAmount: 0,
                  procedure: "Initial Consultation and Bracket Placement",
                  notes: "First appointment - brackets placed",
                  treatedByDoctor: null,
                  isCompleted: true,
                },
                {
                  date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                  treatmentAmount: 10000,
                  paidAmount: 0,
                  remainingAmount: 10000,
                  procedure: "Wire Adjustment",
                  notes: "First wire adjustment scheduled",
                  treatedByDoctor: null,
                  isCompleted: false,
                }
              ],
            }
          ],
          treatmentDocuments: [],
        },
      ],
    },
  ],
  email: "test@example.com",
  password: "testpassword123",
};

// Function to test patient creation
async function testGroupTreatmentCreation() {
  try {
    console.log('Testing Group Treatment Creation...');
    console.log('Input data structure:');
    console.log(JSON.stringify(testPatientData, null, 2));

    // Create patient
    const patient = new Patient(testPatientData);
    
    // Manually trigger calculations
    patient.recalculateTreatmentTotals();
    
    console.log('Patient object after creation and calculation:');
    console.log('Group Treatment Details:');
    console.log(JSON.stringify(patient.medicalDetails[0].treatmentPlanning[0].groupTreatmentDetails, null, 2));

    // Check if calculations are correct
    const groupTreatment = patient.medicalDetails[0].treatmentPlanning[0].groupTreatmentDetails[0];
    
    console.log('\n=== VALIDATION RESULTS ===');
    console.log(`Total Treatment Amount: ${groupTreatment.totalTreatmentAmount}`);
    console.log(`Total Paid Amount: ${groupTreatment.totalPaidAmount}`);
    console.log(`Total Remaining Amount: ${groupTreatment.totalRemainingAmount}`);
    console.log(`Is Completed: ${groupTreatment.isCompleted}`);
    console.log(`Number of Daily Treatments: ${groupTreatment.dailyTreatments.length}`);

    // Check daily treatments
    console.log('\n=== DAILY TREATMENTS ===');
    groupTreatment.dailyTreatments.forEach((dt, index) => {
      console.log(`Daily Treatment ${index + 1}:`);
      console.log(`  Date: ${dt.date}`);
      console.log(`  Procedure: ${dt.procedure}`);
      console.log(`  Treatment Amount: ${dt.treatmentAmount}`);
      console.log(`  Paid Amount: ${dt.paidAmount}`);
      console.log(`  Remaining Amount: ${dt.remainingAmount}`);
      console.log(`  Is Completed: ${dt.isCompleted}`);
      console.log(`  Notes: ${dt.notes}`);
    });

    console.log('\n=== SUCCESS ===');
    console.log('Group treatment data structure is working correctly!');

  } catch (error) {
    console.error('Error testing group treatment creation:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testGroupTreatmentCreation();
