import mongoose from "mongoose";

const RegisterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },

    //  OPTIONAL
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // ⭐ important
    },

    mobile: {
      type: String,
      required: [true, "Mobile is required"],
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
      trim: true,
      unique: true,
    },

    couponCode: {
      type: String,
      required: [true, "Code is required"],
    },

    regNum: {
      type: String,
      unique: true,
    },

    generateQR: {
      type: Boolean,
      default: false,
    },

    dayOne: {
      type: String,
    },

    dayTwo: {
      type: String,
    },

    dayThree: {
      type: String,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Register ||
  mongoose.model("Register", RegisterSchema);
