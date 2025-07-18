const jwt = require('jsonwebtoken');
const User = require('./model/User');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/dms', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkAuth() {
  try {
    console.log('🔍 Checking authentication system...');
    
    // 1. Check if any users exist
    const userCount = await User.countDocuments();
    console.log(`📊 Total users in database: ${userCount}`);
    
    // 2. Check users without permissions
    const usersWithoutPermissions = await User.countDocuments({
      $or: [
        { permissions: { $exists: false } },
        { permissions: null }
      ]
    });
    console.log(`⚠️  Users without permissions: ${usersWithoutPermissions}`);
    
    // 3. List all users with their basic info
    const users = await User.find({}, 'name email role permissions createdAt').limit(10);
    console.log('\n👥 Users in database:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role} - Has Permissions: ${!!user.permissions}`);
    });
    
    // 4. Check if we can create a sample JWT token
    const sampleUser = users[0];
    if (sampleUser) {
      const token = jwt.sign(
        { id: sampleUser._id }, 
        process.env.JWT_SECRET || 'your-secret-key', 
        { expiresIn: '1d' }
      );
      console.log('\n🔑 Sample JWT token created successfully');
      console.log(`Token: ${token.substring(0, 50)}...`);
      
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log(`✅ Token verified successfully for user ID: ${decoded.id}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking auth:', error);
    process.exit(1);
  }
}

checkAuth();