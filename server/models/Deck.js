// // server/models/Deck.js
// import mongoose from "mongoose";

// const DeckSchema = new mongoose.Schema({
//   companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
//   uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//   originalName: { type: String, required: true },
//   storagePath: { type: String, required: true },
//   mimeType: { type: String, required: true },
//   size: { type: Number, required: true },
//   privacy: { type: String, enum: ["private", "public", "nda"], default: "private" },
//   createdAt: { type: Date, default: Date.now },
// });

// export default mongoose.model("Deck", DeckSchema);


// server/models/Deck.js
import mongoose from "mongoose";

const DeckSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    storagePath: { type: String, required: true }, // path on disk or object key in cloud
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },

    /**
     * privacy:
     *  - private : only owner / allowedInvestorIds can view
     *  - public  : anyone with link (or app auth) can view
     *  - nda     : requires NDA acceptance before viewing (investor must accept)
     */
    privacy: { type: String, enum: ["private", "public", "nda"], default: "private" },

    // explicit allow-list for invite-only or post-NDA granting.
    allowedInvestorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Optional: a short human-friendly title / description
    title: { type: String },
    description: { type: String },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

/**
 * Virtual convenience field: true when privacy === 'nda'
 */
DeckSchema.virtual("ndaRequired").get(function () {
  return this.privacy === "nda";
});

/**
 * toJSON / toObject: include virtuals
 */
DeckSchema.set("toJSON", { virtuals: true });
DeckSchema.set("toObject", { virtuals: true });

export default mongoose.model("Deck", DeckSchema);
