import Coupon from "../models/Coupon.js";

/* ==========================
   Create Coupon
========================== */
export const createCoupon = async (req, res) => {
  try {
    const { couponName } = req.body;

    if (!couponName) {
      return res.status(400).json({
        success: false,
        message: "Coupon name is required",
      });
    }

    // Optional: Manual duplicate check (clean message)
    const existingCoupon = await Coupon.findOne({ couponName });
    if (existingCoupon) {
      return res.status(409).json({
        success: false,
        message: "Coupon name already exists",
      });
    }

    const coupon = await Coupon.create({ couponName });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });

  } catch (error) {
    console.error("Create Coupon Error:", error);

    // Handle Mongo duplicate key error (E11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Coupon name already exists",
      });
    }

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
    const { couponName } = req.body;

    if (!couponName) {
      return res.status(400).json({
        success: false,
        message: "Coupon name is required to update",
      });
    }

    // Check if another coupon already has this name
    const existingCoupon = await Coupon.findOne({ couponName });

    if (existingCoupon && existingCoupon._id.toString() !== id) {
      return res.status(409).json({
        success: false,
        message: "Coupon name already exists",
      });
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      { couponName },
      { new: true, runValidators: true }
    );

    if (!updatedCoupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon: updatedCoupon,
    });

  } catch (error) {
    console.error("Update Coupon Error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Coupon name already exists",
      });
    }

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
