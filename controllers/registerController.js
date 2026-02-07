// controllers/registerController.js
import Register from "../models/Register.js";
import Coupon from "../models/Coupon.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";
import { Parser } from "json2csv";

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
   Mobile Number Validation
-------------------------- */
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
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
    const coupon = await Coupon.findOne({ couponCode });
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

    /* ================= SEND EMAIL ================= */
    await sendEmailWithTemplate({
      to: register.email,
      name: register.name,
      templateKey:
        "2518b.554b0da719bc314.k1.1124b400-0014-11f1-8765-cabf48e1bf81.19c1d8acb40",
      mergeInfo: {
        name: register.name,
        email: register.email,
        mobile: register.mobile,
        regNum: register.regNum,
      },
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

    const data = await Promise.all(
      registers.map(async (reg) => {
        const coupon = await Coupon.findOne({ couponCode: reg.couponCode });

        return {
          ...reg.toObject(),
          couponName: coupon ? coupon.couponName : "N/A",
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: data.length,
      registers: data,
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



/* ==========================
   Export Registrations CSV
========================== */
export const exportRegistrationsCSV = async (req, res) => {
  try {
    const registers = await Register.find().sort({ createdAt: -1 });

    if (!registers.length) {
      return res.status(404).json({
        success: false,
        message: "No registrations found",
      });
    }

    /* --------------------------
       Map Coupon Name
    -------------------------- */
    const data = await Promise.all(
      registers.map(async (reg) => {
        const coupon = await Coupon.findOne({ couponCode: reg.couponCode });

        return {
          name: reg.name,
          email: reg.email,
          mobile: reg.mobile,
          couponCode: reg.couponCode,
          couponName: coupon ? coupon.couponName : "N/A",
          regNum: reg.regNum,
          createdAt: reg.createdAt,
        };
      })
    );

    const fields = [
      { label: "Name", value: "name" },
      { label: "Email", value: "email" },
      { label: "Mobile", value: "mobile" },
      { label: "Coupon Code", value: "couponCode" },
      { label: "Coupon Name", value: "couponName" },
      { label: "Registration Number", value: "regNum" },
      {
        label: "Registration Time",
        value: (row) => new Date(row.createdAt).toLocaleString(),
      },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("registrations.csv");

    return res.status(200).send(csv);
  } catch (error) {
    console.error("Export CSV Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
