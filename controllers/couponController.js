// controllers/couponController.js
import Coupon from "../models/Coupon.js";

/* ==========================
   Create Coupon
========================== */
export const createCoupon = async (req, res) => {
  try {
    const { couponName, couponCode, limit } = req.body;

    // Validation
    if (!couponName || !couponCode || limit === undefined) {
      return res.status(400).json({
        success: false,
        message: "Coupon name, coupon code and limit are required",
      });
    }

    if (Number(limit) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Limit must be greater than 0",
      });
    }

    // Check duplicate couponCode
    const existingCoupon = await Coupon.findOne({ couponCode });
    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const coupon = await Coupon.create({
      couponName,
      couponCode,
      limit,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Create Coupon Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ==========================
   Get All Coupons
========================== */
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("Get Coupons Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ==========================
   Get Single Coupon
========================== */
export const getCouponById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("Get Coupon Error:", error);
    return res.status(400).json({
      success: false,
      message: "Invalid Coupon ID",
    });
  }
};

/* ==========================
   Update Coupon
========================== */
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const { couponName, couponCode, limit } = req.body;

    if (!couponName && !couponCode && limit === undefined) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    if (limit !== undefined && Number(limit) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Limit must be greater than 0",
      });
    }

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Prevent duplicate couponCode
    if (couponCode && couponCode !== coupon.couponCode) {
      const exists = await Coupon.findOne({ couponCode });
      if (exists) {
        return res.status(409).json({
          success: false,
          message: "Coupon code already exists",
        });
      }
    }

    coupon.couponName = couponName ?? coupon.couponName;
    coupon.couponCode = couponCode ?? coupon.couponCode;
    coupon.limit = limit ?? coupon.limit;

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Update Coupon Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ==========================
   Delete Coupon
========================== */
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Delete Coupon Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
