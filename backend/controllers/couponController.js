import Coupon from '../models/Coupon.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Referral from '../models/Referral.js';
import mongoose from 'mongoose';

const normalizeSelectedUsers = (selectedUsers = []) =>
  Array.from(new Set((Array.isArray(selectedUsers) ? selectedUsers : [])
    .map((id) => String(id || '').trim())
    .filter(Boolean)));

const isCouponEligibleForUser = async (coupon, userId) => {
  if (coupon.userEligibility === 'all') return true;
  if (!userId) return false;

  if (coupon.userEligibility === 'selected') {
    const selected = normalizeSelectedUsers(coupon.selectedUsers);
    return selected.includes(String(userId));
  }

  if (coupon.userEligibility === 'new') {
    const existingOrder = await Order.findOne({ userId: String(userId) }).select('_id').lean();
    return !existingOrder;
  }

  return true;
};

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
  try {
    const { code, id } = req.body;
    
    // Check for past end date
    if (req.body.validUntil) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(req.body.validUntil) < today) {
        return res.status(400).json({ message: 'End date cannot be in the past' });
      }
    }

    // Check if code exists
    const couponExists = await Coupon.findOne({ code });
    if (couponExists) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    // Generate custom ID if not provided
    const couponId = id || `cpn_${Date.now()}`;

    const normalizedEligibility = req.body.userEligibility || 'all';
    const selectedUsers = normalizedEligibility === 'selected'
      ? normalizeSelectedUsers(req.body.selectedUsers)
      : [];

    const coupon = await Coupon.create({
      ...req.body,
      userEligibility: normalizedEligibility,
      selectedUsers,
      id: couponId
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
export const getAllCoupons = async (req, res) => {
  try {
    const { userId } = req.query;
    let coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();

    if (userId) {
      const eligibilityChecks = await Promise.all(
        coupons.map(async (coupon) => ({ coupon, ok: await isCouponEligibleForUser(coupon, userId) }))
      );
      coupons = eligibilityChecks.filter((item) => item.ok).map((item) => item.coupon);
    }

    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get coupon by ID
// @route   GET /api/coupons/:id
// @access  Private/Admin
export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ id: req.params.id }) || await Coupon.findById(req.params.id);
    if (coupon) {
      res.json(coupon);
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
export const updateCoupon = async (req, res) => {
  try {
    let coupon = await Coupon.findOne({ id: req.params.id }) || await Coupon.findById(req.params.id);

    if (coupon) {
      if (req.body.validUntil) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(req.body.validUntil) < today) {
          return res.status(400).json({ message: 'End date cannot be in the past' });
        }
      }
      coupon.code = req.body.code || coupon.code;
      coupon.type = req.body.type || coupon.type;
      coupon.value = req.body.value !== undefined ? req.body.value : coupon.value;
      coupon.minOrderValue = req.body.minOrderValue !== undefined ? req.body.minOrderValue : coupon.minOrderValue;
      coupon.maxDiscount = req.body.maxDiscount !== undefined ? req.body.maxDiscount : coupon.maxDiscount;
      coupon.validUntil = req.body.validUntil || coupon.validUntil;
      coupon.usageLimit = req.body.usageLimit !== undefined ? req.body.usageLimit : coupon.usageLimit;
      coupon.perUserLimit = req.body.perUserLimit !== undefined ? req.body.perUserLimit : coupon.perUserLimit;
      coupon.active = req.body.active !== undefined ? req.body.active : coupon.active;
      coupon.userEligibility = req.body.userEligibility || coupon.userEligibility;
      coupon.selectedUsers = coupon.userEligibility === 'selected'
        ? normalizeSelectedUsers(req.body.selectedUsers !== undefined ? req.body.selectedUsers : coupon.selectedUsers)
        : [];
      coupon.applicabilityType = req.body.applicabilityType || coupon.applicabilityType;
      coupon.targetItems = req.body.targetItems || coupon.targetItems;

      const updatedCoupon = await coupon.save();
      res.json(updatedCoupon);
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOneAndDelete({ id: req.params.id }) || await Coupon.findByIdAndDelete(req.params.id);
    if (coupon) {
      res.json({ message: 'Coupon removed' });
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Public
export const validateCoupon = async (req, res) => {
  try {
    const { userId, code, cartTotal, cartItems } = req.body;

    let coupon = await Coupon.findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') } });

    if (!coupon) {
        // Check Referrals as backup
        const referral = await Referral.findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') } });
        if (referral && referral.active) {
            if (referral.validTo && new Date(referral.validTo) < new Date()) {
                return res.status(400).json({ valid: false, error: 'Referral code has expired' });
            }
            // Map referral to coupon format for the response
            return res.json({
                valid: true,
                coupon: {
                    code: referral.code,
                    type: referral.type === 'percentage' ? 'percent' : 'fixed',
                    value: referral.value,
                    applicabilityType: 'all' // Referral codes usually apply to everything
                }
            });
        }
        return res.status(404).json({ valid: false, error: 'Invalid coupon or referral code' });
    }
    
    if (!coupon.active) return res.status(400).json({ valid: false, error: 'Coupon is no longer active' });
    if (new Date(coupon.validUntil) < new Date()) return res.status(400).json({ valid: false, error: 'Coupon has expired' });
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return res.status(400).json({ valid: false, error: 'Coupon usage limit reached' });
    if (cartTotal < coupon.minOrderValue) return res.status(400).json({ valid: false, error: `Minimum order value ₹${coupon.minOrderValue} required` });

    // Check user-specific limits
    if (userId) {
      const userLookupQuery = [{ id: String(userId) }];
      if (mongoose.Types.ObjectId.isValid(String(userId))) {
        userLookupQuery.push({ _id: userId });
      }
      const user = await User.findOne({ $or: userLookupQuery });
      // Assuming user model tracks used coupons as array of coupon IDs or codes
      if (user && user.usedCoupons) {
         const usageCount = user.usedCoupons.filter(c => c === coupon.id || c === coupon.code).length;
         if (usageCount >= coupon.perUserLimit) {
             return res.status(400).json({ valid: false, error: 'You have already used this coupon' });
         }
      }

      const eligible = await isCouponEligibleForUser(coupon, String(userId));
      if (!eligible) {
        if (coupon.userEligibility === 'new') {
          return res.status(400).json({ valid: false, error: 'For new users only' });
        }
        if (coupon.userEligibility === 'selected') {
          return res.status(400).json({ valid: false, error: 'Coupon is not available for this account' });
        }
      }
    } else if (coupon.userEligibility === 'new' || coupon.userEligibility === 'selected') {
      return res.status(400).json({ valid: false, error: 'Please login to use this coupon' });
    }

    // Check Applicability
    // We need complete product data for cart items to check categories/subcategories
    // Assuming cartItems contains { productId: '...', ... }
    
    let eligibleItems = [];
    const products = await Product.find({ _id: { $in: cartItems.map(item => item.id || item.productId) } });
    
    if (coupon.applicabilityType === 'all') {
        eligibleItems = cartItems;
    } else {
        eligibleItems = cartItems.filter(item => {
            const product = products.find(p => p._id.toString() === (item.id || item.productId));
            if (!product) return false;
            
            if (coupon.applicabilityType === 'product') {
                return coupon.targetItems.includes(product._id.toString());
            }
            if (coupon.applicabilityType === 'category') {
                // Assuming product.category is a reference or string. 
                // If reference, need to match ID. If string slug, match slug.
                // Our system seems to use slugs or names in mixed ways, let's assume loose matching or ID matching
                return coupon.targetItems.includes(product.category) || coupon.targetItems.includes(product.category?._id);
            }
            if (coupon.applicabilityType === 'subcategory') {
                return coupon.targetItems.includes(product.subcategory);
            }
            return false;
        });
        
        if (eligibleItems.length === 0) {
            return res.status(400).json({ valid: false, error: 'Coupon not applicable to items in your cart' });
        }
    }

    // Calculate Discount
    // NOTE: This logic mimics frontend logic but now secure on backend
    // We should probably rely on valid: true and let frontend or verify endpoint calc amount, 
    // OR return the calculated discount amount here.
    
    // For now, returning valid: true and key info
    res.json({ 
        valid: true, 
        coupon: {
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
            maxDiscount: coupon.maxDiscount,
            applicabilityType: coupon.applicabilityType,
            targetItems: coupon.targetItems
        }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
