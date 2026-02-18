import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    couponName: {
      type: String,
      required: [true, "Coupon Name is required"],
      unique: true,
    }
  },
  { timestamps: true },
);

// Avoid model overwrite during hot-reload
export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
