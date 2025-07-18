const bcrypt = require('bcrypt');
const User = require('./model/User');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/dms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@dms.com' });
    
    if (existingAdmin) {
      console.log('📋 Admin user already exists. Updating permissions...');
      
      // Update existing admin with new permissions
      existingAdmin.permissions = {
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
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully');
      console.log(`📧 Email: admin@dms.com`);
      console.log(`📱 Contact: 1234567890`);
      console.log(`🔑 Use existing password or reset if needed`);
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminUser = new User({
        name: 'System Administrator',
        email: 'admin@dms.com',
        password: hashedPassword,
        role: 'admin',
        contact: '1234567890',
        isActive: true,
        permissions: {
          dashboard: { fullAccess: true, basicAccess: true, analytics: true, reports: true },
          users: { create: true, read: true, update: true, delete: true },
          patients: { create: true, read: true, update: true, delete: true },
          doctors: { create: true, read: true, update: true, delete: true },
          appointments: { create: true, read: true, update: true, delete: true },
          income: { create: true, read: true, update: true, delete: true },
          expenses: { create: true, read: true, update: true, delete: true },
          contacts: { create: true, read: true, update: true, delete: true },
          settings: { access: true, configure: true },
        }
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully');
      console.log(`📧 Email: admin@dms.com`);
      console.log(`📱 Contact: 1234567890`);
      console.log(`🔑 Password: admin123`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();