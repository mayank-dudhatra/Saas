import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  address: { type: String },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  
  // --- NEW FIELD ---
  // This will store the customer's credit/debit balance.
  // A positive number means the customer owes the shop money (Debit).
  // A negative number means the shop owes the customer money (Credit).
  balance: { type: Number, default: 0 },

}, { timestamps: true });

// Ensures a phone number is unique only within a specific shop
CustomerSchema.index({ phone: 1, shopId: 1 }, { unique: true });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);