import mongoose from 'mongoose';

const ShopAdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
});

// Email and phone should be unique per shop (multiple admins can have same email/phone in different shops)
ShopAdminSchema.index({ email: 1, shopId: 1 }, { unique: true });
ShopAdminSchema.index({ phone: 1, shopId: 1 }, { unique: true });

export default mongoose.models.ShopAdmin || mongoose.model('ShopAdmin', ShopAdminSchema);