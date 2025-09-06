// server/models/NDARequest.js
import mongoose from "mongoose";

const NDARequestSchema = new mongoose.Schema(
  {
    deckId: { type: mongoose.Schema.Types.ObjectId, ref: "Deck", required: true, index: true },
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    founderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    signedAt: { type: Date, default: null },
    signedIp: { type: String, default: null },
    note: { type: String }, // optional short note
  },
  { timestamps: true }
);

export default mongoose.model("NDARequest", NDARequestSchema);
