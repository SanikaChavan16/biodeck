// server/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }));

// connect DB
connectDB();

// routes
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => res.send("BioDeck API running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
