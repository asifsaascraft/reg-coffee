import express from "express";
import {
  createRegister,
  getAllRegisters,
  getRegisterById,
  exportRegistersCSV,
} from "../controllers/registerController.js";

const router = express.Router();

/* Register Routes */
router.post("/", createRegister);
router.get("/", getAllRegisters);
router.get("/:id", getRegisterById);

router.get("/export/csv", exportRegistersCSV);   

export default router;
