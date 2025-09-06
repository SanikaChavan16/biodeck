// server/controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Company from "../models/Company.js";
import sendEmail from "../utils/sendEmail.js";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

/**
 * signup
 */
export const signup = async (req, res) => {
  try {
    const { email, password, company } = req.body;
    if (!email || !password || !company?.name) {
      return res.status(400).json({ message: "Email, password and company name are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newCompany = new Company({ name: company.name });
    await newCompany.save();

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const user = new User({
      email,
      passwordHash,
      verifyToken,
      company: newCompany._id,
    });

    newCompany.owner = user._id;
    await user.save();
    await newCompany.save();

    const verifyLink = `${BACKEND_URL}/api/auth/verify-email?token=${verifyToken}&email=${encodeURIComponent(email)}`;

    try {
      await sendEmail({
        to: email,
        subject: "Verify your BioDeck account",
        html: `<p>Please verify by clicking <a href="${verifyLink}">here</a></p>`,
        text: `Verify: ${verifyLink}`,
      });
    } catch (err) {
      console.warn("Email failed:", err.message);
    }

    return res.status(201).json({ message: "Account created. Verification email sent." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * verifyEmail
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.query;
    const decodedEmail = decodeURIComponent(email);

    const user = await User.findOne({ email: decodedEmail, verifyToken: token }).populate("company");
    if (!user) return res.status(400).send("Invalid or expired link");

    user.isVerified = true;
    user.verifyToken = null;
    await user.save();

    const payload = {
      id: user._id,
      email: user.email,
      companyId: user.company?._id || user.company,
      role: user.role || "user",
    };
    const tokenJwt = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    // ✅ Set httpOnly cookie
    res.cookie("token", tokenJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to dashboard
    return res.redirect(`${FRONTEND_URL}/dashboard?verified=1`);
  } catch (err) {
    console.error("verifyEmail error:", err);
    res.status(500).send("Server error");
  }
};

/**
 * login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate("company");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    if (!user.isVerified) return res.status(401).json({ message: "Verify your email first" });

    const payload = {
      id: user._id,
      email: user.email,
      companyId: user.company?._id || user.company,
      role: user.role || "user",
    };
    const tokenJwt = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    // ✅ Set httpOnly cookie
    res.cookie("token", tokenJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Login successful",
      user: { email: user.email, company: user.company },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * resendVerification
 */
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified" });

    const newToken = crypto.randomBytes(32).toString("hex");
    user.verifyToken = newToken;
    await user.save();

    const verifyLink = `${BACKEND_URL}/api/auth/verify-email?token=${newToken}&email=${encodeURIComponent(email)}`;
    await sendEmail({
      to: email,
      subject: "Resend verification",
      html: `<p>Verify again: <a href="${verifyLink}">here</a></p>`,
      text: `Verify: ${verifyLink}`,
    });

    res.json({ message: "Verification email resent" });
  } catch (err) {
    console.error("Resend error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
