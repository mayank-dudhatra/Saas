// This script is NOT part of the Next.js app.
// Run it once from your terminal with: node --loader ./scripts/esm-loader.js scripts/createSuperAdmin.js
// Or use babel-node, ts-node, or other ESM-compatible Node runtime

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import SuperAdmin from '../models/SuperAdmin.js';

dotenv.config({ path: './.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

// --- CONFIGURE YOUR SUPER ADMIN DETAILS HERE ---
const SUPER_ADMIN_EMAIL = "superadmin@example.com";
const SUPER_ADMIN_PASSWORD = "a-very-strong-password-here";
// ---------------------------------------------

const createSuperAdmin = async () => {
  if (!SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD) {
    console.error("Error: Please set SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD in the script.");
    return;
  }

  try {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("Database connected.");

    const existingAdmin = await SuperAdmin.findOne({ email: SUPER_ADMIN_EMAIL });
    if (existingAdmin) {
      console.log("Super Admin with this email already exists.");
      return;
    }

    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

    console.log("Creating Super Admin...");
    await SuperAdmin.create({
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
    });

    console.log("✅ Super Admin created successfully!");
    console.log(`   Email: ${SUPER_ADMIN_EMAIL}`);

  } catch (error) {
    console.error("❌ Error creating Super Admin:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
};

createSuperAdmin();