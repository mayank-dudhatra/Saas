// import mongoose from 'mongoose';

// const ShopSchema = new mongoose.Schema({
//   shopId: { type: String, required: true, unique: true },
//   shopCode: { type: String, required: true, unique: true },
//   name: { type: String, required: true },
//   address: { type: String },
//   city: { type: String },
//   state: { type: String },
// }, { timestamps: true });
// export default mongoose.models.Shop || mongoose.model('Shop', ShopSchema);


import mongoose from 'mongoose';

const ShopSchema = new mongoose.Schema({
  shopId: { type: String, required: true, unique: true },
  shopCode: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  // Status is essential for Super Admin approval flow
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });
export default mongoose.models.Shop || mongoose.model('Shop', ShopSchema);
