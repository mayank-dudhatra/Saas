// This script creates or UPDATES a Super Admin in the database
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

const createOrUpdateSuperAdmin = async () => {
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    console.error("Error: Please set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in your .env.local file.");
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

    console.log("Hashing new password...");
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

    // --- THIS IS THE UPDATED LOGIC ---
    // Find and update the admin if they exist, or create them if they don't.
    const result = await SuperAdmin.findOneAndUpdate(
      { email: SUPER_ADMIN_EMAIL }, // Find user by this email
      { 
        $set: { 
          password: hashedPassword, // Set/update the password
          email: SUPER_ADMIN_EMAIL  // Ensure email is set
        } 
      },
      { 
        upsert: true, // Create a new doc if one doesn't exist
        new: true     // Return the new/updated doc
      }
    );
    // --- END UPDATED LOGIC ---

    if (result) {
      console.log("\n✅ Super Admin created/updated successfully!");
      console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);
      console.log(`   Password: ${SUPER_ADMIN_PASSWORD} (this is now set in the DB)`);
      console.log("\n🚨 You can now log in with these credentials.");
    } else {
      throw new Error("Failed to create or update Super Admin.");
    }

  } catch (error) {
    console.error("❌ Error creating/updating Super Admin:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDatabase connection closed.");
  }
};

createOrUpdateSuperAdmin();