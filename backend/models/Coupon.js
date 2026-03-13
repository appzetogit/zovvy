import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  id: { type: String, unique: true }, // Custom ID: "cpn_01"
  code: { type: String, unique: true },
  type: { type: String, enum: ['percent', 'flat', 'free_shipping'] },
  value: Number,
  minOrderValue: Number,
  maxDiscount: Number,
  validUntil: Date,
  usageLimit: Number,
  usageCount: { type: Number, default: 0 },
  perUserLimit: Number,
  active: { type: Boolean, default: true },
  
  // Enhanced Validation Fields
  userEligibility: { type: String, enum: ['all', 'new', 'selected'], default: 'all' },
  selectedUsers: [{ type: String }], // User custom IDs (e.g. user_123)
  applicabilityType: { type: String, enum: ['all', 'product', 'category', 'subcategory'], default: 'all' },
  targetItems: [{ type: String }], // IDs or slugs depending on type
}, { timestamps: true });

export default mongoose.model('Coupon', couponSchema);
