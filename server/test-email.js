// server/test-email.js
import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const debugLog = (...args) => console.log(new Date().toISOString(), ...args);

const createTransporter = (port, secure) => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure, // true => SSL (465). false => STARTTLS (587)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // small timeout to fail fast if network blocks port
    socketTimeout: 10000,
    connectionTimeout: 10000,
  });
};

const sendWithTransporter = async (transporter, recipient) => {
  await transporter.verify();
  debugLog(`SMTP verify OK (host=${process.env.EMAIL_HOST}, port=${transporter.options.port})`);
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipient,
    subject: "BioDeck — SMTP test",
    text: "This is a test email from BioDeck (SMTP).",
    html: `<p>This is a test email from <strong>BioDeck</strong> (SMTP).</p>`,
  });
  return info;
};

async function runTest() {
  try {
    const recipient = process.env.TEST_TO || process.env.EMAIL_TO || process.env.EMAIL_USER;
    if (!recipient) {
      console.error("❌ No recipient found. Set TEST_TO in your server/.env");
      process.exit(1);
    }

    debugLog("Config:", {
      host: process.env.EMAIL_HOST,
      user: process.env.EMAIL_USER,
      from: process.env.EMAIL_FROM,
      to: recipient,
    });

    // Try port 587 (STARTTLS) first
    try {
      debugLog("Attempting port 587 (STARTTLS)...");
      const t587 = createTransporter(587, false);
      const info = await sendWithTransporter(t587, recipient);
      debugLog("✅ Email sent via port 587:", info.messageId);
      process.exit(0);
    } catch (err587) {
      debugLog("⚠️ Port 587 failed:", err587?.message || err587);
      debugLog("Falling back to port 465 (SSL)...");
      try {
        const t465 = createTransporter(465, true);
        const info2 = await sendWithTransporter(t465, recipient);
        debugLog("✅ Email sent via port 465:", info2.messageId);
        process.exit(0);
      } catch (err465) {
        debugLog("❌ Port 465 also failed:", err465?.message || err465);
        // show the full error so you can paste for debugging
        console.error("FINAL ERROR (465):", err465);
        process.exit(1);
      }
    }
  } catch (finalErr) {
    console.error("Unexpected error:", finalErr);
    process.exit(1);
  }
}

runTest();
