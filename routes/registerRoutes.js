// routes/registerRoutes.js
import express from "express";
import {
  createRegister,
  getAllRegisters,
  getRegisterById,
  exportRegistrationsCSV,
} from "../controllers/registerController.js";

const router = express.Router();

/* Register Routes */
router.post("/", createRegister);
router.get("/", getAllRegisters);
router.get("/:id", getRegisterById);
router.get("/export/csv", exportRegistrationsCSV);

export default router;
