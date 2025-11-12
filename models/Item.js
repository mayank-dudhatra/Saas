import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema({
  baseUnit: { type: String, required: true }, // e.g., 'Bottle', 'Gram', 'Piece'
  secondaryUnit: { type: String }, // e.g., 'Box', 'Kilogram', 'Dozen'
  conversionFactor: { type: Number, default: 1 }, // e.g., 12 (1 Box = 12 Bottles)
}, { _id: false });

const priceSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  taxType: { type: String, enum: ['inclusive', 'exclusive'], required: true, default: 'exclusive' },
}, { _id: false });

const ItemSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  
  name: { type: String, required: true, trim: true },
  hsnCode: { type: String, trim: true },
  category: { type: String, trim: true },
  
  unit: { type: unitSchema, required: true },
  
  // Stock is ALWAYS stored in the base unit
  stockQuantity: { type: Number, required: true, default: 0 },
  // Low stock alert is ALSO stored in the base unit
  lowStockAlertLevel: { type: Number, default: 0 },
  
  purchasePrice: { type: priceSchema, required: true },
  salePrice: { type: priceSchema, required: true },
  
  // This is the fix: Storing the full GST string
  gstSlab: { type: String, default: 'GST@0%' },
  
  imageUrl: { type: String },
  expiryDate: { type: Date },
  
}, { timestamps: true });

// Ensure an item name is unique within a specific shop
ItemSchema.index({ name: 1, shopId: 1 }, { unique: true });

export default mongoose.models.Item || mongoose.model('Item', ItemSchema);