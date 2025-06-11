require('dotenv').config();
const mongoose = require('mongoose');

async function fixEmailIndex() {
  try {
    // Get connection URL from environment variable
    const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/test';
    
    console.log('Connecting to MongoDB at:', dbUrl);
    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB');
    
    // Get all indexes on the patients collection
    const indexes = await mongoose.connection.db.collection('patients').indexes();
    console.log('Current indexes on patients collection:');
    console.log(JSON.stringify(indexes, null, 2));
    
    // Check if there's a unique index on the email field
    const emailIndex = indexes.find(idx => idx.name === 'email_1');
    
    if (emailIndex) {
      console.log('Found email index, dropping it...');
      try {
        await mongoose.connection.db.collection('patients').dropIndex('email_1');
        console.log('Index dropped successfully!');
      } catch (dropError) {
        console.error('Error dropping index:', dropError);
      }
    } else {
      console.log('No email index found');
    }
    
    // Create a new non-unique sparse index if needed
    console.log('Creating new sparse index on email field...');
    await mongoose.connection.db.collection('patients').createIndex(
      { email: 1 },
      { 
        sparse: true,
        unique: false,
        background: true
      }
    );
    console.log('New index created successfully!');
    
    // Verify the changes
    const updatedIndexes = await mongoose.connection.db.collection('patients').indexes();
    console.log('Updated indexes:');
    console.log(JSON.stringify(updatedIndexes, null, 2));
    
    console.log('Email index fix completed successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
fixEmailIndex(); 