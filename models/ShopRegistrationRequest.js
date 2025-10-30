// import mongoose from 'mongoose';

// const ShopRegistrationRequestSchema = new mongoose.Schema({
//   shopName: { type: String, required: true },
//   ownerName: { type: String, required: true },
//   email: { type: String, required: true },
//   phone: { type: String, required: true },
//   password: { type: String, required: true },
//   address: { type: String },
//   city: { type: String },
//   state: { type: String },
//   otp: { type: String, required: true },
//   otpExpires: { type: Date, required: true },
//   status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
//   shopId: { type: String }, // Will be generated after OTP verification
//   shopCode: { type: String }, // Will be generated after OTP verification
// }, { timestamps: true });

// export default mongoose.models.ShopRegistrationRequest || mongoose.model('ShopRegistrationRequest', ShopRegistrationRequestSchema);

import mongoose from 'mongoose';

const ShopRegistrationRequestSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  // FIX: Removed 'required: true' so they can be cleaned up after approval
  otp: { type: String }, 
  otpExpires: { type: Date }, 
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  shopId: { type: String }, // Will be generated after OTP verification
  shopCode: { type: String }, // Will be generated after OTP verification
}, { timestamps: true });

export default mongoose.models.ShopRegistrationRequest || mongoose.model('ShopRegistrationRequest', ShopRegistrationRequestSchema);