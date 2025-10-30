// Script to manually approve a shop registration
require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ShopSchema = new mongoose.Schema({
  shopId: { type: String, required: true, unique: true },
  shopCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
}, { timestamps: true });

const ShopAdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
});

const ShopRegistrationRequestSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  shopId: { type: String },
  shopCode: { type: String },
}, { timestamps: true });

const Shop = mongoose.models.Shop || mongoose.model('Shop', ShopSchema);
const ShopAdmin = mongoose.models.ShopAdmin || mongoose.model('ShopAdmin', ShopAdminSchema);
const ShopRegistrationRequest = mongoose.models.ShopRegistrationRequest || mongoose.model('ShopRegistrationRequest', ShopRegistrationRequestSchema);

const MONGODB_URI = process.env.MONGODB_URI;

// Function to generate unique Shop ID
async function generateShopId() {
  let shopId;
  let isUnique = false;
  
  while (!isUnique) {
    const count = await Shop.countDocuments();
    shopId = `SHOP${String(count + 1).padStart(3, '0')}`;
    
    const exists = await Shop.findOne({ shopId });
    if (!exists) {
      isUnique = true;
    }
  }
  
  return shopId;
}

// Function to generate unique Shop Code
async function generateShopCode() {
  let shopCode;
  let isUnique = false;
  
  while (!isUnique) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    shopCode = '';
    for (let i = 0; i < 3; i++) {
      shopCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const exists = await Shop.findOne({ shopCode });
    if (!exists) {
      isUnique = true;
    }
  }
  
  return shopCode;
}

const approveRegistration = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Database connected.\n");

    // Find the pending registration
    const email = "mayankdudhatra24858@gmail.com";
    const requestRecord = await ShopRegistrationRequest.findOne({ email, status: 'pending' });

    if (!requestRecord) {
      console.log("❌ No pending registration found for:", email);
      const allRequests = await ShopRegistrationRequest.find({ email });
      console.log("Found requests:", allRequests.map(r => ({ status: r.status, createdAt: r.createdAt })));
      return;
    }

    console.log("📋 Found pending registration:");
    console.log(`   Shop Name: ${requestRecord.shopName}`);
    console.log(`   Owner: ${requestRecord.ownerName}`);
    console.log(`   Email: ${requestRecord.email}`);
    console.log(`   Phone: ${requestRecord.phone}`);
    console.log(`   Status: ${requestRecord.status}`);
    console.log(`   OTP Expires: ${requestRecord.otpExpires}`);
    console.log(`   Expired: ${requestRecord.otpExpires < new Date() ? 'Yes' : 'No'}\n`);

    // Check if shop already exists
    const existingShop = await Shop.findOne({ name: requestRecord.shopName });
    let shop;
    let shopId;
    let shopCode;

    if (existingShop) {
      console.log("⚠️  Shop already exists:", existingShop.shopId);
      shop = existingShop;
      shopId = existingShop.shopId;
      shopCode = existingShop.shopCode;

      // Check if ShopAdmin already exists
      const existingAdmin = await ShopAdmin.findOne({ email: requestRecord.email, shopId: shop._id });
      if (existingAdmin) {
        console.log("✅ Shop Admin already exists for this email.");
        // Update request status anyway
        requestRecord.status = 'approved';
        await requestRecord.save();
        console.log("\n✅ Registration updated to approved status.");
        return;
      }
    } else {
      // Generate unique Shop ID and Shop Code
      shopId = await generateShopId();
      shopCode = await generateShopCode();
      console.log(`   Generated Shop ID: ${shopId}`);
      console.log(`   Generated Shop Code: ${shopCode}\n`);

      // Create Shop
      shop = await Shop.create({
        shopId,
        shopCode,
        name: requestRecord.shopName,
        address: requestRecord.address,
        city: requestRecord.city,
        state: requestRecord.state,
      });
      console.log("✅ Shop created:", shop.shopId);
    }

    // Create ShopAdmin
    await ShopAdmin.create({
      name: requestRecord.ownerName,
      email: requestRecord.email,
      phone: requestRecord.phone,
      password: requestRecord.password,
      shopId: shop._id,
    });
    console.log("✅ Shop Admin created");

    // Update the request record
    requestRecord.status = 'approved';
    requestRecord.otp = undefined;
    requestRecord.otpExpires = undefined;
    requestRecord.shopId = shopId;
    requestRecord.shopCode = shopCode;
    await requestRecord.save();
    console.log("✅ Registration request updated to approved\n");

    console.log("🎉 SUCCESS!");
    console.log(`   Shop ID: ${shopId}`);
    console.log(`   Shop Code: ${shopCode}`);
    console.log(`   Email: ${requestRecord.email}`);
    console.log("\n📧 You can now login with these credentials!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log("\nDatabase connection closed.");
  }
};

approveRegistration();

