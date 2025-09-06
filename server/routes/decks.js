// // server/routes/decks.js
// import express from "express";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import { v4 as uuidv4 } from "uuid";
// import Deck from "../models/Deck.js";
// import { requireAuth } from "../middleware/authMiddleware.js";

// const router = express.Router();

// // Multer disk storage to server/uploads
// const uploadsDir = path.join(process.cwd(), "server", "uploads");
// fs.mkdirSync(uploadsDir, { recursive: true });

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadsDir),
//   filename: (req, file, cb) => {
//     const unique = `${Date.now()}-${uuidv4()}-${file.originalname}`;
//     cb(null, unique);
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype !== "application/pdf") return cb(new Error("Only PDF allowed"));
//     cb(null, true);
//   },
// });

// // POST /api/decks - upload
// router.post("/", requireAuth, upload.single("deck"), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//     const deck = new Deck({
//       companyId: req.user.companyId,
//       uploaderId: req.user.id,
//       originalName: req.file.originalname,
//       storagePath: req.file.path,
//       mimeType: req.file.mimetype,
//       size: req.file.size,
//       privacy: req.body.privacy || "private",
//     });
//     await deck.save();
//     res.status(201).json({ message: "Deck uploaded", deckId: deck._id, deck });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ error: err.message || "Upload failed" });
//   }
// });

// // GET /api/decks/my - list user's decks
// router.get("/my", requireAuth, async (req, res) => {
//   try {
//     const decks = await Deck.find({ uploaderId: req.user.id }).sort({ createdAt: -1 }).lean();
//     res.json({ decks });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // GET /api/decks/:id/download - download file (owner/admin)
// router.get("/:id/download", requireAuth, async (req, res) => {
//   try {
//     const deck = await Deck.findById(req.params.id);
//     if (!deck) return res.status(404).json({ error: "Not found" });

//     if (deck.uploaderId.toString() !== req.user.id && req.user.role !== "admin") {
//       return res.status(403).json({ error: "Not authorized" });
//     }

//     res.download(deck.storagePath, deck.originalName);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// export default router;


// server/routes/decks.js
// server/routes/decks.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import Deck from "../models/Deck.js";
import NDARequest from "../models/NDARequest.js";
import AccessLog from "../models/AccessLog.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import checkDeckAccess from "../middleware/checkDeckAccess.js";

const router = express.Router();

// Multer disk storage to server/uploads
const uploadsDir = path.join(process.cwd(), "server", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") return cb(new Error("Only PDF allowed"));
    cb(null, true);
  },
});

// ----------------- POST /api/decks - upload -----------------
router.post("/", requireAuth, upload.single("deck"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const deck = new Deck({
      companyId: req.user.companyId,
      uploaderId: req.user.id,
      originalName: req.file.originalname,
      storagePath: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      privacy: req.body.privacy || "private",
    });
    await deck.save();
    res.status(201).json({ message: "Deck uploaded", deckId: deck._id, deck });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

// ----------------- GET /api/decks/my - list user's decks -----------------
router.get("/my", requireAuth, async (req, res) => {
  try {
    const decks = await Deck.find({ uploaderId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ decks });
  } catch (err) {
    console.error("Fetch my decks error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ----------------- POST /api/decks/:id/request-access -----------------
// Investor requests access to a deck (creates NDARequest if needed)
router.post("/:id/request-access", requireAuth, async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) return res.status(404).json({ error: "Deck not found" });

    // log the request
    await AccessLog.create({ deckId: deck._id, userId: req.user.id, action: "request", ip: req.ip, userAgent: req.get("User-Agent") });

    // If public, nothing to do
    if (deck.privacy === "public") {
      return res.json({ status: "allowed", message: "Deck is public" });
    }

    // check existing NDARequest
    const existing = await NDARequest.findOne({ deckId: deck._id, investorId: req.user.id });
    if (existing) {
      return res.json({ status: existing.status });
    }

    const nda = await NDARequest.create({
      deckId: deck._id,
      investorId: req.user.id,
      founderId: deck.companyId,
      status: "pending",
    });

    // TODO: send notification email to founder using your sendEmail util
    // e.g. sendEmail({ to: founderEmail, subject: 'Access request', text: '...' })

    res.json({ status: "nda_requested", ndaId: nda._id });
  } catch (err) {
    console.error("request-access error:", err);
    res.status(500).json({ error: "Request failed" });
  }
});

// ----------------- POST /api/decks/nda/:ndaId/accept -----------------
// Investor accepts the NDA (click-to-accept). Adds investor to allowedInvestorIds.
router.post("/nda/:ndaId/accept", requireAuth, async (req, res) => {
  try {
    const nda = await NDARequest.findById(req.params.ndaId);
    if (!nda) return res.status(404).json({ error: "NDA request not found" });
    if (String(nda.investorId) !== String(req.user.id)) return res.status(403).json({ error: "Not allowed" });

    nda.status = "accepted";
    nda.signedAt = new Date();
    nda.signedIp = req.ip;
    await nda.save();

    // add to allowedInvestorIds so future access checks pass
    await Deck.findByIdAndUpdate(nda.deckId, { $addToSet: { allowedInvestorIds: req.user.id } });

    await AccessLog.create({ deckId: nda.deckId, userId: req.user.id, action: "nda_signed", ip: req.ip, userAgent: req.get("User-Agent") });

    // TODO: notify founder/investor via email if desired

    res.json({ status: "accepted" });
  } catch (err) {
    console.error("nda accept error:", err);
    res.status(500).json({ error: "Accept failed" });
  }
});

// ----------------- POST /api/decks/nda/:ndaId/reject -----------------
// Investor or founder rejection (founder may reject from dashboard).
router.post("/nda/:ndaId/reject", requireAuth, async (req, res) => {
  try {
    const nda = await NDARequest.findById(req.params.ndaId);
    if (!nda) return res.status(404).json({ error: "NDA request not found" });

    // Allow investor to cancel their own request, or founder/admin to reject
    const isInvestor = String(nda.investorId) === String(req.user.id);
    const isFounder = String(nda.founderId) === String(req.user.id);
    if (!isInvestor && !isFounder && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not allowed to reject this NDA" });
    }

    nda.status = "rejected";
    await nda.save();

    await AccessLog.create({ deckId: nda.deckId, userId: req.user.id, action: "rejected", ip: req.ip, userAgent: req.get("User-Agent"), meta: { by: req.user.id } });

    // TODO: notify the other party via email if desired

    res.json({ status: "rejected" });
  } catch (err) {
    console.error("nda reject error:", err);
    res.status(500).json({ error: "Reject failed" });
  }
});

// ----------------- GET /api/decks/:id/requests -----------------
// Return pending NDA requests for this deck (only owner/uploader or admin).
router.get("/:id/requests", requireAuth, async (req, res) => {
  try {
    const deckId = req.params.id;
    const deck = await Deck.findById(deckId).lean();
    if (!deck) return res.status(404).json({ error: "Deck not found" });

    // only owner/uploader or admin may view requests
    const isOwner = String(deck.companyId) === String(req.user.companyId) || String(deck.uploaderId) === String(req.user.id);
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ error: "Not authorized" });
    }

    // fetch pending NDA requests and include investor basic info (adjust fields to your User schema)
    const requests = await NDARequest.find({ deckId, status: "pending" })
      .sort({ createdAt: -1 })
      .populate({ path: "investorId", select: "name email company role" })
      .lean();

    res.json({ requests });
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// ----------------- POST /api/decks/:id/approve-investor -----------------
// Founder approves an investor (adds to allowedInvestorIds).
router.post("/:id/approve-investor", requireAuth, async (req, res) => {
  try {
    const { investorId } = req.body;
    if (!investorId) return res.status(400).json({ error: "Missing investorId" });

    const deck = await Deck.findById(req.params.id);
    if (!deck) return res.status(404).json({ error: "Deck not found" });

    // Only owner/uploader or admin can approve
    const isOwner = String(deck.companyId) === String(req.user.companyId) || String(deck.uploaderId) === String(req.user.id);
    if (!isOwner && req.user.role !== "admin") return res.status(403).json({ error: "Not authorized" });

    await Deck.findByIdAndUpdate(deck._id, { $addToSet: { allowedInvestorIds: investorId } });
    await AccessLog.create({ deckId: deck._id, userId: investorId, action: "approved", ip: req.ip, userAgent: req.get("User-Agent") });

    // TODO: notify investor via email

    res.json({ ok: true });
  } catch (err) {
    console.error("approve-investor error:", err);
    res.status(500).json({ error: "Approve failed" });
  }
});

// ----------------- GET /api/decks/:id/download -----------------
// Protected download endpoint — uses checkDeckAccess middleware which logs and
// enforces privacy (owner/admin, allowedInvestorIds, NDA accepted, public).
router.get("/:id/download", requireAuth, checkDeckAccess(), async (req, res) => {
  try {
    const deck = req.deck; // set by middleware
    if (!deck) return res.status(404).json({ error: "Not found" });

    // stream file
    if (!fs.existsSync(deck.storagePath)) return res.status(410).json({ error: "File missing" });

    // log download
    await AccessLog.create({ deckId: deck._id, userId: req.user.id, action: "downloaded", ip: req.ip, userAgent: req.get("User-Agent") });

    res.download(deck.storagePath, deck.originalName);
  } catch (err) {
    console.error("download error:", err);
    res.status(500).json({ error: err.message || "Download failed" });
  }
});
// GET /api/decks/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id).lean();
    if (!deck) return res.status(404).json({ error: "Deck not found" });
    res.json({ deck });
  } catch (err) {
    console.error("Get deck error:", err);
    res.status(500).json({ error: "Failed to fetch deck" });
  }
});



export default router;
