import mongoose from 'mongoose';

const SaleItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  name: { type: String, required: true },
  hsnCode: { type: String, default: 'N/A' },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  rate: { type: Number, required: true }, // Per unit price
  taxType: { type: String, required: true }, // 'inclusive' or 'exclusive'
  taxableAmount: { type: Number, required: true }, // Total before tax
  gstRate: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  discount: { type: Number, default: 0 }, // Item-wise discount
  netAmount: { type: Number, required: true }, // Row total (Incl. Tax)
}, { _id: false });

const SaleSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  billNumber: { type: String, required: true },
  date: { type: Date, default: Date.now },
  items: [SaleItemSchema],
  
  totalTaxableValue: { type: Number, required: true }, 
  totalCGST: { type: Number, default: 0 },
  totalSGST: { type: Number, default: 0 },
  totalGST: { type: Number, required: true },
  billDiscount: { type: Number, default: 0 }, // Overall bill discount
  
  grossAmount: { type: Number, required: true },
  roundOff: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  amountInWords: { type: String },
  
  paymentMode: { type: String, enum: ['Cash', 'Online', 'Credit'], default: 'Cash' },
  billType: { type: String, default: 'Tax Invoice' },
}, { timestamps: true });

export default mongoose.models.Sale || mongoose.model('Sale', SaleSchema);