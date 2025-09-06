// server/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import deckRoutes from "./routes/decks.js"; // if you have decks
import decksSimpleRouter from './routes/decks.simple.js';
dotenv.config();

// ✅ create app first
const app = express();

// ✅ then apply middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use('/api/decks', decksSimpleRouter);
// connect DB
connectDB();

// routes
app.use("/api/auth", authRoutes);
app.use("/api/decks", deckRoutes); // if decks exist

// test route
app.get("/", (req, res) => res.send("BioDeck API running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
