const bcrypt = require('bcrypt');
const User = require('./model/User');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.DB_URL || 'mongodb://localhost:27017/dms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createSuperAdminUser() {
  try {
    console.log('🔧 Creating superadmin user...');
    
    // Check if superadmin user already exists
    const existingSuperAdmin = await User.findOne({ 
      $or: [
        { email: 'superadmin@dms.com' },
        { contact: '9762307366' },
        { role: 'superadmin' }
      ]
    });
    
    if (existingSuperAdmin) {
      console.log('📋 Superadmin user found. Updating to latest permissions...');
      
      // Update existing user with superadmin role and full permissions
      existingSuperAdmin.role = 'superadmin';
      existingSuperAdmin.permissions = {
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
      existingSuperAdmin.isActive = true;
      
      await existingSuperAdmin.save();
      console.log('✅ Superadmin user updated successfully');
      console.log(`📧 Email: ${existingSuperAdmin.email}`);
      console.log(`📱 Contact: ${existingSuperAdmin.contact}`);
      console.log(`🔑 Use existing password (likely: 123456)`);
    } else {
      console.log('👤 Creating new superadmin user...');
      
      // Create new superadmin user
      const hashedPassword = await bcrypt.hash('123456', 10);
      const superAdminUser = new User({
        name: 'Super Administrator',
        email: 'superadmin@dms.com',
        password: hashedPassword,
        role: 'superadmin',
        contact: '9762307366',
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
          popups: { create: true, read: true, update: true, delete: true, schedule: true, activate: true, deactivate: true },
          system: { fullAccess: true, userManagement: true, systemConfig: true, backupRestore: true },
        }
      });
      
      await superAdminUser.save();
      console.log('✅ Superadmin user created successfully');
      console.log(`📧 Email: superadmin@dms.com`);
      console.log(`📱 Contact: 9762307366`);
      console.log(`🔑 Password: 123456`);
    }
    
    console.log('\n🚀 Superadmin Features Available:');
    console.log('   • Full system access');
    console.log('   • User management');
    console.log('   • Popup notifications management');
    console.log('   • System configuration');
    console.log('   • All admin privileges + more');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating superadmin user:', error);
    process.exit(1);
  }
}

createSuperAdminUser();