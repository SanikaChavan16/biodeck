// // server/test-email.js
// import dotenv from "dotenv";
// dotenv.config();
// import nodemailer from "nodemailer";

// const debugLog = (...args) => console.log(new Date().toISOString(), ...args);

// const createTransporter = (port, secure) => {
//   return nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port,
//     secure, // true => SSL (465). false => STARTTLS (587)
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//     // small timeout to fail fast if network blocks port
//     socketTimeout: 10000,
//     connectionTimeout: 10000,
//   });
// };

// const sendWithTransporter = async (transporter, recipient) => {
//   await transporter.verify();
//   debugLog(`SMTP verify OK (host=${process.env.EMAIL_HOST}, port=${transporter.options.port})`);
//   const info = await transporter.sendMail({
//     from: process.env.EMAIL_FROM,
//     to: recipient,
//     subject: "BioDeck — SMTP test",
//     text: "This is a test email from BioDeck (SMTP).",
//     html: `<p>This is a test email from <strong>BioDeck</strong> (SMTP).</p>`,
//   });
//   return info;
// };

// async function runTest() {
//   try {
//     const recipient = process.env.TEST_TO || process.env.EMAIL_TO || process.env.EMAIL_USER;
//     if (!recipient) {
//       console.error("❌ No recipient found. Set TEST_TO in your server/.env");
//       process.exit(1);
//     }

//     debugLog("Config:", {
//       host: process.env.EMAIL_HOST,
//       user: process.env.EMAIL_USER,
//       from: process.env.EMAIL_FROM,
//       to: recipient,
//     });

//     // Try port 587 (STARTTLS) first
//     try {
//       debugLog("Attempting port 587 (STARTTLS)...");
//       const t587 = createTransporter(587, false);
//       const info = await sendWithTransporter(t587, recipient);
//       debugLog("✅ Email sent via port 587:", info.messageId);
//       process.exit(0);
//     } catch (err587) {
//       debugLog("⚠️ Port 587 failed:", err587?.message || err587);
//       debugLog("Falling back to port 465 (SSL)...");
//       try {
//         const t465 = createTransporter(465, true);
//         const info2 = await sendWithTransporter(t465, recipient);
//         debugLog("✅ Email sent via port 465:", info2.messageId);
//         process.exit(0);
//       } catch (err465) {
//         debugLog("❌ Port 465 also failed:", err465?.message || err465);
//         // show the full error so you can paste for debugging
//         console.error("FINAL ERROR (465):", err465);
//         process.exit(1);
//       }
//     }
//   } catch (finalErr) {
//     console.error("Unexpected error:", finalErr);
//     process.exit(1);
//   }
// }

// runTest();


// server/test-email.js
import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const debugLog = (...args) => console.log(new Date().toISOString(), ...args);

function getEnv(name, fallback = "") {
  const v = (process.env[name] || fallback);
  return typeof v === "string" ? v.trim() : v;
}

async function sendViaSendGrid(recipient, subject, text, html) {
  try {
    // dynamic import so script still works if package isn't installed
    const sg = await import('@sendgrid/mail');
    const SENDGRID_API_KEY = getEnv('SENDGRID_API_KEY') || getEnv('EMAIL_PASS') || '';
    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY not set');
    }
    sg.default.setApiKey(SENDGRID_API_KEY);
    const from = getEnv('EMAIL_FROM', 'no-reply@yourdomain.com').replace(/^"|"$/g, '');
    const msg = {
      to: recipient,
      from,
      subject,
      text,
      html,
    };

    debugLog('Attempting SendGrid API send...');
    const resp = await sg.default.send(msg);
    debugLog('✅ SendGrid API send success. Response:');
    console.log(resp);
    return { provider: 'sendgrid', resp };
  } catch (err) {
    // bubble up so fallback can run
    debugLog('⚠️ SendGrid API send failed or not configured:', err?.message || err);
    throw err;
  }
}

function createNodemailerTransporter() {
  const host = getEnv('EMAIL_HOST', 'smtp.sendgrid.net');
  const port = Number(getEnv('EMAIL_PORT', '587'));
  const secure = port === 465;
  const user = getEnv('EMAIL_USER', 'apikey'); // SendGrid expects 'apikey' as username
  const pass = getEnv('EMAIL_PASS', getEnv('SENDGRID_API_KEY', ''));

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    tls: { ciphers: 'TLSv1.2' },
  });

  return transporter;
}

async function sendViaSMTP(recipient, subject, text, html) {
  const transporter = createNodemailerTransporter();
  try {
    debugLog(`Verifying SMTP transporter (host=${transporter.options.host}, port=${transporter.options.port})...`);
    await transporter.verify();
    debugLog('✅ SMTP transporter verified. Sending mail...');
    const info = await transporter.sendMail({
      from: getEnv('EMAIL_FROM', 'no-reply@yourdomain.com').replace(/^"|"$/g, ''),
      to: recipient,
      subject,
      text,
      html,
    });
    debugLog('✅ SMTP send success:', info.messageId || info);
    return { provider: 'smtp', info };
  } catch (err) {
    debugLog('❌ SMTP send failed:', err && (err.response || err.message) ? (err.response || err.message) : err);
    throw err;
  }
}

async function runTest() {
  const recipient = getEnv('TEST_TO') || getEnv('EMAIL_TO') || getEnv('EMAIL_USER');
  if (!recipient) {
    console.error('❌ No recipient found. Set TEST_TO in your server/.env');
    process.exit(1);
  }

  const subject = 'BioDeck — Email test';
  const text = 'This is a test email from BioDeck.';
  const html = '<p>This is a test email from <strong>BioDeck</strong>.</p>';

  // Try SendGrid API first if key exists
  const sendgridKey = getEnv('SENDGRID_API_KEY') || getEnv('EMAIL_PASS') || '';
  if (sendgridKey) {
    try {
      const result = await sendViaSendGrid(recipient, subject, text, html);
      debugLog('Done via SendGrid:', result.provider);
      process.exit(0);
    } catch (sgErr) {
      debugLog('SendGrid path failed, will attempt SMTP fallback if configured...');
      // proceed to SMTP fallback
    }
  } else {
    debugLog('SENDGRID_API_KEY not found — skipping SendGrid API path and attempting SMTP (if configured).');
  }

  // SMTP fallback
  try {
    const result = await sendViaSMTP(recipient, subject, text, html);
    debugLog('Done via SMTP:', result.provider);
    process.exit(0);
  } catch (smtpErr) {
    console.error('❌ All email methods failed. Last error:');
    console.error(smtpErr && smtpErr.response ? smtpErr.response : smtpErr);
    process.exit(1);
  }
}

// Run the script
runTest();
