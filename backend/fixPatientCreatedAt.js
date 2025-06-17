// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const Patient = require('./model/Patient');

// Connect to MongoDB manually
async function connectToMongoDB() {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Successfully connected to MongoDB database');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
}

async function fixPatientCreatedAt() {
  // Connect to the database
  const connected = await connectToMongoDB();
  if (!connected) {
    console.error('Failed to connect to the database. Script aborted.');
    process.exit(1);
  }

  try {
    console.log('Starting to update patient records with missing createdAt values...');
    
    // First, log the total number of patients
    const totalPatients = await Patient.countDocuments();
    console.log(`Total patients in database: ${totalPatients}`);
    
    // Find all patients (with or without personalDetails.createdAt)
    const allPatients = await Patient.find({});
    console.log(`Retrieved ${allPatients.length} patients to check.`);
    
    // Check and report createdAt status
    let missingCreatedAt = 0;
    let hasCreatedAt = 0;
    let hasPersonalDetailsCreatedAt = 0;
    
    allPatients.forEach(patient => {
      if (patient.createdAt) {
        hasCreatedAt++;
      } else {
        console.log(`Patient ${patient._id} has no document createdAt field!`);
      }
      
      if (patient.personalDetails && patient.personalDetails.createdAt) {
        hasPersonalDetailsCreatedAt++;
      } else {
        missingCreatedAt++;
      }
    });
    
    console.log(`Patients with document createdAt: ${hasCreatedAt}/${allPatients.length}`);
    console.log(`Patients with personalDetails.createdAt: ${hasPersonalDetailsCreatedAt}/${allPatients.length}`);
    console.log(`Patients missing personalDetails.createdAt: ${missingCreatedAt}/${allPatients.length}`);
    
    // Proceed with updates if needed
    if (missingCreatedAt > 0) {
      console.log('Updating patients with missing personalDetails.createdAt...');
      
      let updatedCount = 0;
      
      for (const patient of allPatients) {
        if (!patient.personalDetails) {
          console.log(`Patient ${patient._id} has no personalDetails, skipping.`);
          continue;
        }
        
        if (!patient.personalDetails.createdAt) {
          // Use document createdAt as personalDetails.createdAt
          if (patient.createdAt) {
            patient.personalDetails.createdAt = patient.createdAt;
            await patient.save();
            updatedCount++;
            console.log(`Updated patient ${patient._id} with createdAt: ${patient.createdAt}`);
          } else {
            console.log(`Patient ${patient._id} has no top-level createdAt field, using current date.`);
            patient.personalDetails.createdAt = new Date();
            await patient.save();
            updatedCount++;
          }
        }
      }
      
      console.log(`Successfully updated ${updatedCount} patients.`);
    } else {
      console.log('All patients already have personalDetails.createdAt set. No updates needed.');
    }
    
    console.log('Script completed.');
  } catch (error) {
    console.error('Error updating patient records:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the fix
fixPatientCreatedAt(); 