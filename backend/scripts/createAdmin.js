const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dns = require("dns");
const path = require("path");

// Force Google DNS for SRV resolution
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../model/User");

const adminData = {
  name: "Admin",
  email: "admin@dental.com",
  password: "Admin@1234",
  role: "admin",
  contact: "9800000000",
  isActive: true,
};

async function createAdmin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.DB_URL, {
      serverSelectionTimeoutMS: 30000,
      family: 4,
    });
    console.log("✅ Connected to MongoDB");

    // Check if admin already exists
    const existing = await User.findOne({ email: adminData.email });
    if (existing) {
      console.log(`⚠️  User with email "${adminData.email}" already exists.`);
      console.log(`   Role: ${existing.role} | Active: ${existing.isActive}`);
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const admin = new User({
      ...adminData,
      password: hashedPassword,
    });

    await admin.save();

    console.log("\n✅ Admin user created successfully!");
    console.log("─────────────────────────────────");
    console.log(`  Name    : ${adminData.name}`);
    console.log(`  Email   : ${adminData.email}`);
    console.log(`  Password: ${adminData.password}`);
    console.log(`  Role    : ${adminData.role}`);
    console.log("─────────────────────────────────");
    console.log("Use these credentials to log in.\n");
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
