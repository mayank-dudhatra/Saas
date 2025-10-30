// import mongoose from 'mongoose';

// const ShopAdminSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true },
//   phone: { type: String, required: true },
//   password: { type: String, required: true },
//   shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
// });

// // Email and phone should be unique per shop (multiple admins can have same email/phone in different shops)
// ShopAdminSchema.index({ email: 1, shopId: 1 }, { unique: true });
// ShopAdminSchema.index({ phone: 1, shopId: 1 }, { unique: true });

// export default mongoose.models.ShopAdmin || mongoose.model('ShopAdmin', ShopAdminSchema);


import mongoose from 'mongoose';

const ShopAdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  // NEW: Add status field - inherits from shop, but useful for quick reference
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
});

// Email and phone should be unique per shop (multiple admins can have same email/phone in different shops)
ShopAdminSchema.index({ email: 1, shopId: 1 }, { unique: true });
ShopAdminSchema.index({ phone: 1, shopId: 1 }, { unique: true });

export default mongoose.models.ShopAdmin || mongoose.model('ShopAdmin', ShopAdminSchema);