// server/models/Company.js
import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  website: { type: String },
  stage: { type: String }, // e.g., Seed, Series A
  domain: { type: String }, // e.g., oncology, therapeutics
  summary: { type: String },
  logoUrl: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("Company", companySchema);
