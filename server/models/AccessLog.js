// server/models/AccessLog.js
import mongoose from "mongoose";

const AccessLogSchema = new mongoose.Schema(
  {
    deckId: { type: mongoose.Schema.Types.ObjectId, ref: "Deck" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, enum: ["request", "nda_signed", "approved", "issued_link", "downloaded", "viewed"], required: true },
    ip: { type: String },
    userAgent: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed }, // store any small metadata
  },
  { timestamps: true }
);

export default mongoose.model("AccessLog", AccessLogSchema);
