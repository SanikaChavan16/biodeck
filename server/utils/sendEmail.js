// // server/utils/sendEmail.js
// import nodemailer from "nodemailer";
// import dotenv from "dotenv";
// dotenv.config();

// let transporter = null;

// function getTransporter() {
//   if (transporter) return transporter;

//   const host = process.env.EMAIL_HOST;
//   const port = Number(process.env.EMAIL_PORT || 587);
//   const secure = port === 465; // 465 = SSL, else STARTTLS

//   transporter = nodemailer.createTransport({
//     host,
//     port,
//     secure,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//     // optional timeouts
//     connectionTimeout: 10000,
//     socketTimeout: 10000,
//   });

//   // optional: verify at startup / first use
//   transporter.verify().then(() => {
//     console.log("✅ Mail transporter verified");
//   }).catch((err) => {
//     console.warn("⚠️ Mail transporter verify failed:", err?.message || err);
//   });

//   return transporter;
// }

// /**
//  * sendEmail({ to, subject, text, html })
//  * - to: string or array
//  * - subject: string
//  * - text/html: body
//  */
// export async function sendEmail({ to, subject, text, html }) {
//   const tr = getTransporter();
//   if (!to) throw new Error("Missing `to` in sendEmail");
//   const info = await tr.sendMail({
//     from: process.env.EMAIL_FROM,
//     to,
//     subject,
//     text,
//     html,
//   });
//   return info;
// }

// export default sendEmail;



// server/utils/sendEmail.js
import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

let transporter = null;

/**
 * If SENDGRID_API_KEY is set, prefer SendGrid API (@sendgrid/mail).
 * Otherwise, fall back to nodemailer SMTP using EMAIL_HOST/PORT/USER/PASS.
 */
function getTransporter() {
  if (transporter) return transporter;

  const apiKey = (process.env.SENDGRID_API_KEY || process.env.EMAIL_PASS || "").trim();

  if (apiKey) {
    // Use SendGrid API
    sgMail.setApiKey(apiKey);
    transporter = {
      async sendMail({ from, to, subject, text, html }) {
        const msg = {
          to,
          from: (from || process.env.EMAIL_FROM || "no-reply@yourdomain.com").replace(/^"|"$/g, ""),
          subject,
          text,
          html,
        };
        return sgMail.send(msg);
      },
      verify: async () => true,
    };
    console.log("✅ SendGrid API mailer initialized");
  } else {
    // Fallback: SMTP
    const host = process.env.EMAIL_HOST || "smtp.sendgrid.net";
    const port = Number(process.env.EMAIL_PORT || 587);
    const secure = port === 465; // 465 = SSL, else STARTTLS
    const user = process.env.EMAIL_USER || "apikey";
    const pass = process.env.EMAIL_PASS;

    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 10000,
      socketTimeout: 10000,
      tls: { ciphers: "TLSv1.2" },
    });

    transporter.verify()
      .then(() => console.log("✅ SMTP mail transporter verified"))
      .catch((err) => console.warn("⚠️ SMTP mail transporter verify failed:", err?.message || err));
  }

  return transporter;
}

/**
 * sendEmail({ to, subject, text, html })
 */
export async function sendEmail({ to, subject, text, html }) {
  const tr = getTransporter();
  if (!to) throw new Error("Missing `to` in sendEmail");

  const from = (process.env.EMAIL_FROM || "no-reply@yourdomain.com").replace(/^"|"$/g, "");

  try {
    const info = await tr.sendMail
      ? tr.sendMail({ from, to, subject, text, html }) // nodemailer transport
      : tr({ from, to, subject, text, html }); // sendGrid wrapper
    return info;
  } catch (err) {
    console.error("❌ sendEmail failed:", err?.response?.body || err);
    throw err;
  }
}

export default sendEmail;
