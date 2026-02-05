import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    couponName: {
      type: String,
      required: [true, "Coupon Name is required"],
    },
    couponCode: {
      type: String,
      required: [true, "Coupon Code is required"],
      unique: true,
    },
    limit: {
      type: Number,
      required: [true, "Limit is required"],
    }
  },
  { timestamps: true },
);

// Avoid model overwrite during hot-reload
export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
