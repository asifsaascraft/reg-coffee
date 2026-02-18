import express from "express";
import {
  createRegister,
  getAllRegisters,
  getRegisterById,
} from "../controllers/registerController.js";

const router = express.Router();

/* Register Routes */
router.post("/", createRegister);
router.get("/", getAllRegisters);
router.get("/:id", getRegisterById);

export default router;
