import mongoose from "mongoose";

const RegisterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },

    mobile: {
      type: String,
    },

    note: {
      type: String,
    },

    regNum: {
      type: String,
      required: [true, "Reg Number is required"],
      unique: true,
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
