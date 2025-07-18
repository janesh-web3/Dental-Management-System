const mongoose = require('mongoose');
const User = require('./model/User');
require('dotenv').config();

// Function to update existing users with permissions
const migrateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db-name');
    console.log('Connected to MongoDB');

    // Find all users without permissions field
    const usersToUpdate = await User.find({
      $or: [
        { permissions: { $exists: false } },
        { permissions: null }
      ]
    });

    console.log(`Found ${usersToUpdate.length} users to update`);

    for (const user of usersToUpdate) {
      console.log(`Updating user: ${user.name} (${user.email}) - Role: ${user.role}`);
      
      // Set permissions based on role
      if (user.role === 'admin') {
        user.permissions = {
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
        // Staff and other roles get limited permissions
        user.permissions = {
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

      // Set default values for new fields
      if (!user.isActive) {
        user.isActive = true;
      }
      
      if (!user.createdAt) {
        user.createdAt = new Date();
      }
      
      if (!user.updatedAt) {
        user.updatedAt = new Date();
      }

      // Save the user
      await user.save();
      console.log(`✓ Updated user: ${user.name}`);
    }

    console.log('Migration completed successfully!');
    console.log(`Updated ${usersToUpdate.length} users`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the migration
migrateUsers();