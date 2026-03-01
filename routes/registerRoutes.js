import express from "express";
import {
  createRegister,
  getAllRegisters,
  markDayOneDelivered,
  markDayTwoDelivered,
  markDayThreeDelivered,
  getDayOneDelivered,
  getDayTwoDelivered,
  getDayThreeDelivered,
  getRegisterById,
} from "../controllers/registerController.js";

const router = express.Router();

/* Register Routes */
router.post("/", createRegister);
router.get("/", getAllRegisters);

/* Day Delivery POST */
router.post("/day1", markDayOneDelivered);
router.post("/day2", markDayTwoDelivered);
router.post("/day3", markDayThreeDelivered);

/* Day Delivery GET */
router.get("/day1", getDayOneDelivered);
router.get("/day2", getDayTwoDelivered);
router.get("/day3", getDayThreeDelivered);

/* Single */
router.get("/:id", getRegisterById);

export default router;
