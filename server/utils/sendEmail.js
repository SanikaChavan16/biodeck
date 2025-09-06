// server/utils/sendEmail.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = port === 465; // 465 = SSL, else STARTTLS

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // optional timeouts
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });

  // optional: verify at startup / first use
  transporter.verify().then(() => {
    console.log("✅ Mail transporter verified");
  }).catch((err) => {
    console.warn("⚠️ Mail transporter verify failed:", err?.message || err);
  });

  return transporter;
}

/**
 * sendEmail({ to, subject, text, html })
 * - to: string or array
 * - subject: string
 * - text/html: body
 */
export async function sendEmail({ to, subject, text, html }) {
  const tr = getTransporter();
  if (!to) throw new Error("Missing `to` in sendEmail");
  const info = await tr.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
  return info;
}

export default sendEmail;
