import express from "express";
import {
  createRegister,
  getAllRegisters,
  getRegisterById,
  exportRegistrationsCSV,
  markDayOneDelivered,
  markDayTwoDelivered,
  markDayThreeDelivered,
  getDayOneDelivered,
  getDayTwoDelivered,
  getDayThreeDelivered,
} from "../controllers/registerController.js";

const router = express.Router();

/* Register */
router.post("/", createRegister);
router.get("/", getAllRegisters);

/* CSV */
router.get("/export/csv", exportRegistrationsCSV);

/* Day Delivery POST */
router.post("/day1/:regNum", markDayOneDelivered);
router.post("/day2/:regNum", markDayTwoDelivered);
router.post("/day3/:regNum", markDayThreeDelivered);

/* Day Delivery GET */
router.get("/day1", getDayOneDelivered);
router.get("/day2", getDayTwoDelivered);
router.get("/day3", getDayThreeDelivered);

/* Single */
router.get("/:id", getRegisterById);

export default router;
