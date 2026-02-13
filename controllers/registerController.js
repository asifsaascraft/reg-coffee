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
    //  email removed from required
    if (!name || !mobile || !couponCode) {
      return res.status(400).json({
        success: false,
        message: "Name, mobile and coupon code are required",
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
      email, // optional
      mobile,
      couponCode,
      regNum,
      generateQR: true,
    });

    /* ================= SEND EMAIL ================= */
    //  send only if email present
    if (register.email) {
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
    }

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
          email: reg.email || "",
          mobile: reg.mobile,
          couponCode: reg.couponCode,
          couponName: coupon ? coupon.couponName : "N/A",
          regNum: reg.regNum,
          dayOne: reg.dayOne || "",
          dayTwo: reg.dayTwo || "",
          dayThree: reg.dayThree || "",

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
      { label: "Day 1 Kit", value: "dayOne" },
      { label: "Day 2 Kit", value: "dayTwo" },
      { label: "Day 3 Kit", value: "dayThree" },

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


/* ==========================
   Day 1 Delivery
========================== */
export const markDayOneDelivered = async (req, res) => {
  try {
    const { regNum } = req.body;

    if (!regNum) {
      return res.status(400).json({
        success: false,
        message: "regNum is required",
      });
    }

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
      message: "Day 1 wristband delivered",
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

    if (!regNum) {
      return res.status(400).json({
        success: false,
        message: "regNum is required",
      });
    }

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
      message: "Day 2 wristband delivered",
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

    if (!regNum) {
      return res.status(400).json({
        success: false,
        message: "regNum is required",
      });
    }

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
      message: "Day 3 wristband delivered",
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
