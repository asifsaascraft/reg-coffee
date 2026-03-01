// controllers/registerController.js
import Register from "../models/Register.js";

/* ==========================
   Create Registration
========================== */
export const createRegister = async (req, res) => {
  try {
    const { name, email, mobile, note, regNum } = req.body;

    // Basic Required Validation
    if (!name || !regNum) {
      return res.status(400).json({
        success: false,
        message: "Name and Registration Number are required",
      });
    }

    // Check Unique Reg Number
    const existingRegNum = await Register.findOne({ regNum });
    if (existingRegNum) {
      return res.status(409).json({
        success: false,
        message: "Registration Number already exists",
      });
    }

    // Optional: Check Unique Email (if provided)
    if (email) {
      const existingEmail = await Register.findOne({
        email: email.toLowerCase().trim(),
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Email already registered",
        });
      }
    }

    const register = await Register.create({
      name,
      email: email?.toLowerCase().trim(),
      mobile,
      note,
      regNum,
    });

    return res.status(201).json({
      success: true,
      message: "Registration created successfully",
      data: register,
    });

  } catch (error) {
    console.error("Create Register Error:", error);
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
      data: registers,
    });

  } catch (error) {
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
      data: register,
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID",
    });
  }
};

/* ==========================
   Mark Day Delivered (Reusable)
========================== */
const markDelivered = async (req, res, dayField, dayLabel) => {
  try {
    const { regNum } = req.body;

    if (!regNum) {
      return res.status(400).json({
        success: false,
        message: "Registration Number is required",
      });
    }

    const register = await Register.findOne({ regNum });

    if (!register) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    if (register[dayField] === "Delivered") {
      return res.status(400).json({
        success: false,
        message: `${dayLabel} already marked as Delivered`,
      });
    }

    register[dayField] = "Delivered";
    await register.save();

    return res.status(200).json({
      success: true,
      message: `${dayLabel} marked successfully`,
      data: register,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const markDayOneDelivered = (req, res) =>
  markDelivered(req, res, "dayOne", "Day 1");

export const markDayTwoDelivered = (req, res) =>
  markDelivered(req, res, "dayTwo", "Day 2");

export const markDayThreeDelivered = (req, res) =>
  markDelivered(req, res, "dayThree", "Day 3");

/* ==========================
   Get Day Delivered Lists
========================== */
export const getDayOneDelivered = async (req, res) => {
  const data = await Register.find({ dayOne: "Delivered" });
  res.json({ success: true, count: data.length, data });
};

export const getDayTwoDelivered = async (req, res) => {
  const data = await Register.find({ dayTwo: "Delivered" });
  res.json({ success: true, count: data.length, data });
};

export const getDayThreeDelivered = async (req, res) => {
  const data = await Register.find({ dayThree: "Delivered" });
  res.json({ success: true, count: data.length, data });
};