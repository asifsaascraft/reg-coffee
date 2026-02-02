import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";

// Routes
import couponRoutes from "./routes/couponRoutes.js";
import registerRoutes from "./routes/registerRoutes.js";

const app = express();

// =======================
// CORS setup for multiple frontends
// =======================
const allowedOrigins = [
  "https://localhost:3000",
  "https://localhost:3001",
  process.env.FRONTEND_URL,
];


// const corsOptions = {                                                                 
//   origin: (origin, callback) => {
//     // allow any origin (including browser requests)
//     callback(null, true);
//   },
//   credentials: true,
// };

const corsOptions = {
  origin: function (origin, callback) {
    // Allow server-to-server & Postman
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    console.error("CORS blocked origin:", origin)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true, // 🔥 REQUIRED for cookies
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser()); // Needed to read cookies (refresh token)
app.use(morgan("dev"));

// =======================
// Health check
// =======================
app.get("/", (req, res) => {
  res.send("Backend is running.............");
});

// =======================
// API Routes
// =======================

app.use("/api/coupons", couponRoutes);
app.use("/api/registers", registerRoutes);


// =======================
// Start Server SAFELY
// =======================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();