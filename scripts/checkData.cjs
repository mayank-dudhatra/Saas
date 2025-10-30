// Script to check database records
require('dotenv').config({ path: './.env.local' });
const mongoose = require('mongoose');

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

const SuperAdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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
const SuperAdmin = mongoose.models.SuperAdmin || mongoose.model('SuperAdmin', SuperAdminSchema);
const ShopRegistrationRequest = mongoose.models.ShopRegistrationRequest || mongoose.model('ShopRegistrationRequest', ShopRegistrationRequestSchema);

const MONGODB_URI = process.env.MONGODB_URI;

const checkData = async () => {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Database connected.\n");

    // Check Super Admins
    const superAdmins = await SuperAdmin.find();
    console.log("📋 Super Admins:", superAdmins.length);
    superAdmins.forEach(admin => {
      console.log(`  - ${admin.email}`);
    });

    // Check Shops
    const shops = await Shop.find();
    console.log("\n📋 Shops:", shops.length);
    shops.forEach(shop => {
      console.log(`  - ${shop.shopId} (${shop.shopCode}): ${shop.name}`);
    });

    // Check Shop Admins
    const shopAdmins = await ShopAdmin.find().populate('shopId');
    console.log("\n📋 Shop Admins:", shopAdmins.length);
    shopAdmins.forEach(admin => {
      console.log(`  - ${admin.name} (${admin.email}) - Shop: ${admin.shopId?.shopId || 'N/A'}`);
    });

    // Check Registration Requests
    const requests = await ShopRegistrationRequest.find();
    console.log("\n📋 Registration Requests:", requests.length);
    requests.forEach(req => {
      console.log(`  - ${req.email} (${req.status}) - Shop: ${req.shopName}`);
      if (req.phone) {
        console.log(`    Phone: ${req.phone}`);
      } else {
        console.log(`    ⚠️  Phone missing!`);
      }
    });

    console.log("\n✅ Check complete!");

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDatabase connection closed.");
  }
};

checkData();
