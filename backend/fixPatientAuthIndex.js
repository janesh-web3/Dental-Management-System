require('dotenv').config();
const mongoose = require('mongoose');

async function fixPatientAuthIndex() {
  try {
    // Get connection URL from environment variable
    const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/test';
    
    console.log('Connecting to MongoDB at:', dbUrl);
    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB');
    
    // Get all indexes on the patientauths collection
    const indexes = await mongoose.connection.db.collection('patientauths').indexes();
    console.log('Current indexes on patientauths collection:');
    console.log(JSON.stringify(indexes, null, 2));
    
    // Check if there's a unique index on the email field
    const emailIndex = indexes.find(idx => idx.name === 'email_1');
    
    if (emailIndex) {
      console.log('Found email index on PatientAuth, dropping it...');
      try {
        await mongoose.connection.db.collection('patientauths').dropIndex('email_1');
        console.log('PatientAuth email index dropped successfully!');
      } catch (dropError) {
        console.error('Error dropping index:', dropError);
      }
    } else {
      console.log('No email index found on PatientAuth collection');
    }
    
    // Create a new non-unique index if needed
    console.log('Creating new non-unique index on email field...');
    await mongoose.connection.db.collection('patientauths').createIndex(
      { email: 1 },
      { 
        background: true,
        unique: false
      }
    );
    console.log('New index created successfully!');
    
    // Verify the changes
    const updatedIndexes = await mongoose.connection.db.collection('patientauths').indexes();
    console.log('Updated indexes:');
    console.log(JSON.stringify(updatedIndexes, null, 2));
    
    console.log('PatientAuth index fix completed successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
fixPatientAuthIndex(); 