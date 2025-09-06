// server/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  verifyToken: { type: String },
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
