// server/middleware/checkDeckAccess.js
// Usage: attach after authenticate middleware and before download/presign handlers
// e.g. router.get('/:deckId/download', authenticate, checkDeckAccess, downloadHandler);

import Deck from "../models/Deck.js";
import NDARequest from "../models/NDARequest.js";
import AccessLog from "../models/AccessLog.js";

export default function checkDeckAccess() {
  return async function (req, res, next) {
    try {
      const user = req.user; // requires your auth middleware to set req.user
      const deckId = req.params.deckId || req.body.deckId;
      if (!deckId) return res.status(400).json({ error: "Missing deck id" });

      const deck = await Deck.findById(deckId).lean();
      if (!deck) return res.status(404).json({ error: "Deck not found" });

      // owner or admin always allowed
      const isOwner = user && (String(user.companyId) === String(deck.companyId) || String(user._id) === String(deck.uploaderId));
      const isAdmin = user && user.role === "admin";
      if (isOwner || isAdmin) {
        req.deck = deck;
        await AccessLog.create({ deckId: deck._id, userId: user?._id, action: "viewed", ip: req.ip, userAgent: req.get("User-Agent") });
        return next();
      }

      // public deck => allow
      if (deck.privacy === "public") {
        req.deck = deck;
        await AccessLog.create({ deckId: deck._id, userId: user?._id, action: "viewed", ip: req.ip, userAgent: req.get("User-Agent") });
        return next();
      }

      // invite-style: check allowedInvestorIds
      if (deck.allowedInvestorIds && deck.allowedInvestorIds.length) {
        const allowed = deck.allowedInvestorIds.map(String).includes(String(user?._id));
        if (allowed) {
          req.deck = deck;
          await AccessLog.create({ deckId: deck._id, userId: user?._id, action: "viewed", ip: req.ip, userAgent: req.get("User-Agent") });
          return next();
        }
      }

      // nda required: check NDARequest accepted
      if (deck.privacy === "nda") {
        const nda = await NDARequest.findOne({ deckId: deck._id, investorId: user._id, status: "accepted" }).lean();
        if (nda) {
          req.deck = deck;
          await AccessLog.create({ deckId: deck._id, userId: user._id, action: "viewed", ip: req.ip, userAgent: req.get("User-Agent") });
          return next();
        }
        return res.status(403).json({ error: "NDA required. Please request access." });
      }

      // default: private
      return res.status(403).json({ error: "Access denied. Private deck." });
    } catch (err) {
      console.error("checkDeckAccess error:", err);
      return res.status(500).json({ error: "Internal error" });
    }
  };
}
