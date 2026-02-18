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
    const { name, email, mobile, couponId } = req.body;

    /* ---------------- Required ---------------- */
    if (!name || !email || !mobile || !couponId) {
      return res.status(400).json({
        success: false,
        message: "Name, email, mobile and couponId are required",
      });
    }

    /* ---------------- Email Format ---------------- */
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    /* ---------------- Email Duplicate ---------------- */
    const emailExists = await Register.findOne({
      email: email.toLowerCase().trim(),
    });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    /* ---------------- Mobile Validation ---------------- */
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits",
      });
    }

    /* ---------------- Mobile Duplicate ---------------- */
    const mobileExists = await Register.findOne({ mobile });
    if (mobileExists) {
      return res.status(409).json({
        success: false,
        message: "Mobile number already registered",
      });
    }

    /* ---------------- Check Coupon Exists ---------------- */
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon selected",
      });
    }

    /* ---------------- Generate Reg Number ---------------- */
    const lastReg = await Register.findOne({})
      .sort({ createdAt: -1 })
      .select("regNum");

    let nextNumber = 1;
    if (lastReg?.regNum) {
      nextNumber = parseInt(lastReg.regNum.split("-")[1]) + 1;
    }

    const regNum = `REG-${nextNumber}`;

    /* ---------------- Create ---------------- */
    const register = await Register.create({
      name,
      email: email.toLowerCase().trim(),
      mobile,
      couponId,
      regNum,
      generateQR: true,
    });

    /* ---------------- Send Email ---------------- */
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
    const registers = await Register.find()
      .populate("couponId", "couponName")
      .sort({ createdAt: -1 });

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

    const register = await Register.findById(id)
      .populate("couponId", "couponName");

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
export const exportRegistersCSV = async (req, res) => {
  try {
    const registers = await Register.find()
      .populate("couponId", "couponName")
      .sort({ createdAt: -1 });

    if (!registers.length) {
      return res.status(404).json({
        success: false,
        message: "No registrations found",
      });
    }

    const headers = [
      "Name",
      "Email",
      "Mobile",
      "Hear About",
      "Registration Number",
      "Registration Time",
    ];

    const rows = registers.map((reg) => [
      reg.name,
      reg.email,
      reg.mobile,
      reg.couponId?.couponName || "N/A",
      reg.regNum,
      new Date(reg.createdAt).toLocaleString("en-US"),
    ]);

    const csvContent =
      [headers, ...rows]
        .map((row) => row.map((field) => `"${field}"`).join(","))
        .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=registrations.csv"
    );

    return res.status(200).send(csvContent);

  } catch (error) {
    console.error("Export CSV Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ==========================
   Day 1 Delivery
========================== */
export const markDayOneDelivered = async (req, res) => {
  try {
    const { regNum } = req.body;

    const register = await Register.findOne({ regNum });
    if (!register) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    if (register.dayOne === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Already delivered for Day 1",
      });
    }

    register.dayOne = "Delivered";
    await register.save();

    return res.status(200).json({
      success: true,
      message: "Day 1 Scanned Successfully",
      data: {
        name: register.name,
        regNum: register.regNum,
      },
    });
  } catch (error) {
    console.error("Day 1 Delivery Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ==========================
   Day 2 Delivery
========================== */
export const markDayTwoDelivered = async (req, res) => {
  try {
    const { regNum } = req.body;

    const register = await Register.findOne({ regNum });
    if (!register) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    if (register.dayTwo === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Already delivered for Day 2",
      });
    }

    register.dayTwo = "Delivered";
    await register.save();

    return res.status(200).json({
      success: true,
      message: "Day 2 Scanned Successfully",
      data: {
        name: register.name,
        regNum: register.regNum,
      },
    });
  } catch (error) {
    console.error("Day 2 Delivery Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ==========================
   Day 3 Delivery
========================== */
export const markDayThreeDelivered = async (req, res) => {
  try {
    const { regNum } = req.body;

    const register = await Register.findOne({ regNum });
    if (!register) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    if (register.dayThree === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Already delivered for Day 3",
      });
    }

    register.dayThree = "Delivered";
    await register.save();

    return res.status(200).json({
      success: true,
      message: "Day 3 Scanned Successfully",
      data: {
        name: register.name,
        regNum: register.regNum,
      },
    });
  } catch (error) {
    console.error("Day 3 Delivery Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ==========================
   GET Day 1 Delivered List
========================== */
export const getDayOneDelivered = async (req, res) => {
  try {
    const data = await Register.find({ dayOne: "Delivered" });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ==========================
   GET Day 2 Delivered List
========================== */
export const getDayTwoDelivered = async (req, res) => {
  try {
    const data = await Register.find({ dayTwo: "Delivered" });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ==========================
   GET Day 3 Delivered List
========================== */
export const getDayThreeDelivered = async (req, res) => {
  try {
    const data = await Register.find({ dayThree: "Delivered" });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};