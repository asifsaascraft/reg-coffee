// controllers/registerController.js
import Register from "../models/Register.js";
import Coupon from "../models/Coupon.js";

/* ==========================
   Create Registration
========================== */
export const createRegister = async (req, res) => {
  try {
    const { name, email, mobile, couponCode } = req.body;

    /* --------------------------
       Basic Validation
    -------------------------- */
    if (!name || !email || !mobile || !couponCode) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    /* --------------------------
       Email Duplicate Check
    -------------------------- */
    const emailExists = await Register.findOne({ email });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    /* --------------------------
       Mobile Duplicate Check
    -------------------------- */
    const mobileExists = await Register.findOne({ mobile });
    if (mobileExists) {
      return res.status(409).json({
        success: false,
        message: "Mobile number already registered",
      });
    }

    /* --------------------------
       Check Coupon Exists
    -------------------------- */
    const coupon = await Coupon.findOne({ couponName: couponCode });
    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    /* --------------------------
       Check Coupon Usage Limit
    -------------------------- */
    const usedCount = await Register.countDocuments({ couponCode });

    if (usedCount >= coupon.limit) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit exceeded",
      });
    }

    /* --------------------------
       Generate Registration Number
    -------------------------- */
    const lastReg = await Register.findOne({})
      .sort({ createdAt: -1 })
      .select("regNum");

    let nextNumber = 1001;
    if (lastReg?.regNum) {
      nextNumber = parseInt(lastReg.regNum.split("-")[1]) + 1;
    }

    const regNum = `REG-${nextNumber}`;

    /* --------------------------
       Create Registration
    -------------------------- */
    const register = await Register.create({
      name,
      email,
      mobile,
      couponCode,
      regNum,
      generateQR: true,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      register,
    });
  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


/* ==========================
   Get All Registrations
========================== */
export const getAllRegisters = async (req, res) => {
  try {
    const registers = await Register.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: registers.length,
      registers,
    });
  } catch (error) {
    console.error("Get Registers Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ==========================
   Get Single Registration
========================== */
export const getRegisterById = async (req, res) => {
  try {
    const { id } = req.params;

    const register = await Register.findById(id);
    if (!register) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    return res.status(200).json({
      success: true,
      register,
    });
  } catch (error) {
    console.error("Get Register Error:", error);
    return res.status(400).json({
      success: false,
      message: "Invalid ID",
    });
  }
};
