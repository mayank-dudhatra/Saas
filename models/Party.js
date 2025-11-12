import mongoose from 'mongoose';

const PartySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, default: '' },
  email: { type: String, default: '' },
  gstin: { type: String, default: '' },
  gstType: { 
    type: String, 
    enum: ['Registered', 'Unregistered', 'Composition'], 
    default: 'Unregistered' 
  },
  // We will use 'balance' to store the opening balance and all future transactions
  balance: { type: Number, default: 0 }, 
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
}, { timestamps: true });

// Ensures a phone number is unique only within a specific shop
PartySchema.index({ phone: 1, shopId: 1 }, { unique: true });
// Optional: Index for GSTIN
PartySchema.index({ gstin: 1, shopId: 1 }, { unique: true, sparse: true });


export default mongoose.models.Party || mongoose.model('Party', PartySchema);