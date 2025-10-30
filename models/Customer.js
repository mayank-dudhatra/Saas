import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  address: { type: String },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
}, { timestamps: true });

// Ensures a phone number is unique only within a specific shop
CustomerSchema.index({ phone: 1, shopId: 1 }, { unique: true });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);