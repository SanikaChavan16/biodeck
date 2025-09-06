// server/routes/decks.simple.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import authenticate from '../middleware/authMiddleware.js'; // your auth
import Deck from '../models/Deck.js';
import NDARequest from '../models/NDARequest.js';
import AccessLog from '../models/AccessLog.js';
import sendEmail from '../utils/sendEmail.js'; // optional notifications

const router = express.Router();

// simple local upload storage (uploads/ folder)
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

// ----------------- upload deck (founder) -----------------
router.post('/upload', authenticate, upload.single('deck'), async (req, res) => {
  try {
    // only founders allowed in your app logic; check role if you have it
    const { sharingMode = 'nda_required' } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const deck = await Deck.create({
      companyId: req.user.companyId || req.user._id, // adapt to your schema
      filename: req.file.originalname,
      localPath: path.relative(process.cwd(), req.file.path),
      sharingMode,
    });

    res.json({ ok: true, deck });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ----------------- investor requests access -----------------
router.post('/:deckId/request-access', authenticate, async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.deckId);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    await AccessLog.create({ deckId: deck._id, userId: req.user._id, action: 'request', ip: req.ip, userAgent: req.get('User-Agent') });

    if (deck.sharingMode === 'public') return res.json({ status: 'allowed' });

    if (deck.sharingMode === 'invite') {
      // send notif to founder (or just create record)
      // optionally create an NDARequest with status pending to track
      await NDARequest.create({ deckId: deck._id, investorId: req.user._id, founderId: deck.companyId, status: 'pending' });
      // notify founder
      // sendEmail({ to: founderEmail, subject: 'Access request', text: '...' })
      return res.json({ status: 'requested' });
    }

    if (deck.sharingMode === 'nda_required') {
      // create NDA request and return NDA id for investor to accept
      const existing = await NDARequest.findOne({ deckId: deck._id, investorId: req.user._id });
      if (existing) return res.json({ status: existing.status });

      const nda = await NDARequest.create({
        deckId: deck._id,
        investorId: req.user._id,
        founderId: deck.companyId,
        status: 'pending',
      });
      // send email to investor with link to accept (optional)
      return res.json({ status: 'nda_requested', ndaId: nda._id });
    }

    return res.status(400).json({ error: 'Cannot request access' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Request failed' });
  }
});

// ----------------- investor accepts NDA (click-to-accept) -----------------
router.post('/nda/:ndaId/accept', authenticate, async (req, res) => {
  try {
    const nda = await NDARequest.findById(req.params.ndaId);
    if (!nda) return res.status(404).json({ error: 'NDA request not found' });
    if (!nda.investorId.equals(req.user._id)) return res.status(403).json({ error: 'Not allowed' });

    nda.status = 'accepted';
    nda.signedAt = new Date();
    nda.signedIp = req.ip;
    await nda.save();

    // optionally add investor to allowed list:
    await Deck.findByIdAndUpdate(nda.deckId, { $addToSet: { allowedInvestorIds: req.user._id } });

    await AccessLog.create({ deckId: nda.deckId, userId: req.user._id, action: 'nda_signed', ip: req.ip });

    // notify founder/investor via email if desired
    // sendEmail({ to: founderEmail, subject: 'NDA signed', text: '...' });

    res.json({ status: 'accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Accept failed' });
  }
});

// ----------------- founder approves invite request (simple endpoint) -----------------
router.post('/:deckId/approve-investor', authenticate, async (req, res) => {
  try {
    const { investorId } = req.body;
    const deck = await Deck.findById(req.params.deckId);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    // check ownership
    if (!deck.companyId.equals(req.user.companyId || req.user._id)) return res.status(403).json({ error: 'Not owner' });

    await Deck.findByIdAndUpdate(deck._id, { $addToSet: { allowedInvestorIds: investorId } });
    await AccessLog.create({ deckId: deck._id, userId: investorId, action: 'approved', ip: req.ip });

    // email investor
    // sendEmail({ to: investorEmail, subject: 'Access approved', text: '...' });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Approve failed' });
  }
});

// ----------------- secure download/view endpoint -----------------
router.get('/:deckId/download', authenticate, async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.deckId);
    if (!deck) return res.status(404).json({ error: 'Deck not found' });

    // owner or admin allowed
    if (deck.companyId.equals(req.user.companyId || req.user._id) || req.user.role === 'admin') {
      // stream file
    } else {
      // public?
      if (deck.sharingMode === 'public') {
        // allowed
      } else if (deck.sharingMode === 'invite') {
        if (!deck.allowedInvestorIds.some(id => id.equals(req.user._id))) return res.status(403).json({ error: 'Invite only' });
      } else if (deck.sharingMode === 'nda_required') {
        const nda = await NDARequest.findOne({ deckId: deck._id, investorId: req.user._id, status: 'accepted' });
        if (!nda) return res.status(403).json({ error: 'NDA required' });
      } else {
        return res.status(403).json({ error: 'Private' });
      }
    }

    // log and stream the file
    await AccessLog.create({ deckId: deck._id, userId: req.user._id, action: 'downloaded', ip: req.ip, userAgent: req.get('User-Agent') });

    const abs = path.join(process.cwd(), deck.localPath);
    if (!fs.existsSync(abs)) return res.status(410).json({ error: 'File missing' });

    res.setHeader('Content-Disposition', `attachment; filename="${deck.filename}"`);
    const readStream = fs.createReadStream(abs);
    readStream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;
