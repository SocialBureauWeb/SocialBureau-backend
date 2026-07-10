const sendMail = require("../utils/sendMail");

const LOGO_URL =
  "https://pub-6bdb3bc9c27e4291a1a7b1cf77f0be68.r2.dev/sb-logo.webp";
const BRAND_COLOR = "#3B82F6";

// ─── Shared layout wrapper ───────────────────────────────────────────────────
const wrap = (body) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SocialBureau Billing</title>
</head>
<body style="margin:0;padding:0;background:#0A0C10;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0A0C10;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111827;border-radius:16px;overflow:hidden;border:1px solid #1F2937;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1E3A5F,#0F1729);padding:28px 36px;text-align:center;">
            <img src="${LOGO_URL}" alt="SocialBureau" width="140" style="display:inline-block;" />
            <p style="color:#93C5FD;margin:8px 0 0;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Billing Notification</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0D1117;padding:20px 36px;text-align:center;border-top:1px solid #1F2937;">
            <p style="color:#4B5563;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} SocialBureau. All rights reserved.<br/>
              <a href="https://socialbureau.in" style="color:#3B82F6;text-decoration:none;">socialbureau.in</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── Payment badge helper ─────────────────────────────────────────────────────
const statusBadge = (status) => {
  const colors = {
    pending: { bg: "#1C2A18", text: "#4ADE80", border: "#22C55E" },
    paid: { bg: "#1C2A3A", text: "#60A5FA", border: "#3B82F6" },
    overdue: { bg: "#2A1C1C", text: "#F87171", border: "#EF4444" },
  };
  const c = colors[status] || colors.pending;
  return `<span style="background:${c.bg};color:${c.text};border:1px solid ${c.border};padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;text-transform:uppercase;">${status}</span>`;
};

// ─── Payment detail block ─────────────────────────────────────────────────────
const paymentDetails = (payment) => `
<table width="100%" cellpadding="0" cellspacing="0"
  style="background:#0D1117;border:1px solid #1F2937;border-radius:12px;margin-top:20px;">
  <tr>
    <td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${row("Title", payment.title)}
        ${payment.description ? row("Description", payment.description) : ""}
        ${row("Amount", `<strong style="color:#4ADE80;font-size:18px;">₹${Number(payment.amount).toLocaleString("en-IN")}</strong>`)}
        ${row("Due Date", new Date(payment.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }))}
        ${row("Type", payment.type === "monthly" ? "Monthly Recurring" : "One-time")}
        ${row("Status", statusBadge(payment.status))}
      </table>
    </td>
  </tr>
</table>`;

const row = (label, value) => `
<tr>
  <td style="color:#6B7280;font-size:13px;padding:6px 0;width:120px;vertical-align:top;">${label}</td>
  <td style="color:#E5E7EB;font-size:14px;padding:6px 0;">${value}</td>
</tr>`;

// ─── CTA button ───────────────────────────────────────────────────────────────
const ctaButton = (text, url) => `
<div style="text-align:center;margin-top:28px;">
  <a href="${url}" style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:600;font-size:15px;">
    ${text}
  </a>
</div>`;

// ─── Email senders ────────────────────────────────────────────────────────────

/**
 * Notify client that a new payment has been created for them.
 */
const sendPaymentCreatedEmail = async ({ clientEmail, clientName, payment }) => {
  const html = wrap(`
    <h2 style="color:#E5E7EB;margin:0 0 8px;font-size:22px;">New Payment Created</h2>
    <p style="color:#9CA3AF;margin:0 0 4px;">Hi <strong style="color:#E5E7EB;">${clientName}</strong>,</p>
    <p style="color:#9CA3AF;margin:0;">A new payment has been created for your account.</p>
    ${paymentDetails(payment)}
    ${payment.razorpayEnabled ? ctaButton("Pay Now", "https://socialbureau.in/billing") : ""}
    <p style="color:#6B7280;font-size:13px;margin-top:24px;">If you have any questions, reply to this email or contact your account manager.</p>
  `);

  await sendMail({
    to: clientEmail,
    subject: `New Payment: ${payment.title} — ₹${Number(payment.amount).toLocaleString("en-IN")}`,
    html,
  });
};

/**
 * Notify client that a payment has been updated.
 */
const sendPaymentUpdatedEmail = async ({ clientEmail, clientName, payment }) => {
  const html = wrap(`
    <h2 style="color:#E5E7EB;margin:0 0 8px;font-size:22px;">Payment Updated</h2>
    <p style="color:#9CA3AF;margin:0 0 4px;">Hi <strong style="color:#E5E7EB;">${clientName}</strong>,</p>
    <p style="color:#9CA3AF;margin:0;">A payment on your account has been updated. Here are the latest details:</p>
    ${paymentDetails(payment)}
    ${payment.razorpayEnabled && payment.status !== "paid" ? ctaButton("View & Pay", "https://socialbureau.in/billing") : ""}
    <p style="color:#6B7280;font-size:13px;margin-top:24px;">If you have any questions, please contact your account manager.</p>
  `);

  await sendMail({
    to: clientEmail,
    subject: `Payment Updated: ${payment.title}`,
    html,
  });
};

/**
 * Notify client that their payment has been marked as paid.
 */
const sendPaymentPaidEmail = async ({ clientEmail, clientName, payment }) => {
  const html = wrap(`
    <h2 style="color:#4ADE80;margin:0 0 8px;font-size:22px;">✅ Payment Confirmed</h2>
    <p style="color:#9CA3AF;margin:0 0 4px;">Hi <strong style="color:#E5E7EB;">${clientName}</strong>,</p>
    <p style="color:#9CA3AF;margin:0;">Your payment has been received and confirmed. Thank you!</p>
    ${paymentDetails({ ...payment, status: "paid" })}
    <p style="color:#6B7280;font-size:13px;margin-top:24px;">We appreciate your prompt payment. If you need a receipt or have questions, contact us anytime.</p>
  `);

  await sendMail({
    to: clientEmail,
    subject: `Payment Received: ${payment.title} — ₹${Number(payment.amount).toLocaleString("en-IN")}`,
    html,
  });
};

/**
 * Send a due date reminder (X days before due).
 */
const sendPaymentReminderEmail = async ({ clientEmail, clientName, payment, daysLeft }) => {
  const urgency = daysLeft <= 1 ? "#F97316" : "#FBBF24";
  const html = wrap(`
    <h2 style="color:${urgency};margin:0 0 8px;font-size:22px;">⏰ Payment Due ${daysLeft === 0 ? "Today" : `in ${daysLeft} Day${daysLeft > 1 ? "s" : ""}`}</h2>
    <p style="color:#9CA3AF;margin:0 0 4px;">Hi <strong style="color:#E5E7EB;">${clientName}</strong>,</p>
    <p style="color:#9CA3AF;margin:0;">This is a friendly reminder that the following payment is due ${daysLeft === 0 ? "today" : `in ${daysLeft} day${daysLeft > 1 ? "s" : ""}`}.</p>
    ${paymentDetails(payment)}
    ${payment.razorpayEnabled ? ctaButton("Pay Now →", "https://socialbureau.in/billing") : ""}
    <p style="color:#6B7280;font-size:13px;margin-top:24px;">Please ensure timely payment to avoid overdue charges.</p>
  `);

  await sendMail({
    to: clientEmail,
    subject: `Payment Reminder: ${payment.title} due ${daysLeft === 0 ? "today" : `in ${daysLeft} day(s)`}`,
    html,
  });
};

/**
 * Send an overdue notice.
 */
const sendPaymentOverdueEmail = async ({ clientEmail, clientName, payment, daysOverdue }) => {
  const html = wrap(`
    <h2 style="color:#F87171;margin:0 0 8px;font-size:22px;">🚨 Payment Overdue</h2>
    <p style="color:#9CA3AF;margin:0 0 4px;">Hi <strong style="color:#E5E7EB;">${clientName}</strong>,</p>
    <p style="color:#9CA3AF;margin:0;">Your payment is <strong style="color:#F87171;">${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue</strong>. Please settle it at the earliest to avoid further action.</p>
    ${paymentDetails({ ...payment, status: "overdue" })}
    ${payment.razorpayEnabled ? ctaButton("Pay Now →", "https://socialbureau.in/billing") : ""}
    <p style="color:#6B7280;font-size:13px;margin-top:24px;">If you have already made this payment or have concerns, please contact us immediately.</p>
  `);

  await sendMail({
    to: clientEmail,
    subject: `⚠️ Overdue: ${payment.title} — ${daysOverdue} day(s) past due`,
    html,
  });
};

module.exports = {
  sendPaymentCreatedEmail,
  sendPaymentUpdatedEmail,
  sendPaymentPaidEmail,
  sendPaymentReminderEmail,
  sendPaymentOverdueEmail,
};
