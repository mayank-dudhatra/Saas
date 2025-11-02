// This script creates a Super Admin in the database
// Run it with: node scripts/createSuperAdmin.cjs

require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models manually since we're using CommonJS
const SuperAdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const SuperAdmin = mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', SuperAdminSchema);

const MONGODB_URI = process.env.MONGODB_URI;

// --- CONFIGURE YOUR SUPER ADMIN DETAILS HERE ---
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
// ---------------------------------------------

const createSuperAdmin = async () => {
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    console.error("Error: Please set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in the script.");
    return;
  }

  if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI is not set in .env.local");
    return;
  }

  try {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Database connected.");

    const existingAdmin = await SuperAdmin.findOne({ email: SUPER_ADMIN_EMAIL });
    if (existingAdmin) {
      console.log("⚠️  Super Admin with this email already exists:");
      console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
      return;
    }

    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

    console.log("Creating Super Admin...");
    await SuperAdmin.create({
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
    });

    console.log("\n✅ Super Admin created successfully!");
    console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log("\n🚨 IMPORTANT: Save these credentials securely!");

  } catch (error) {
    console.error("❌ Error creating Super Admin:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDatabase connection closed.");
  }
};

createSuperAdmin();

