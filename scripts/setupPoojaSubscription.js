/**
 * One-time setup script: creates the ₹500/month Razorpay plan (if
 * RAZORPAY_PLAN_ID is not already set) and creates/reuses Pooja's portfolio
 * subscription record.
 *
 * Usage:
 *   node backend/scripts/setupPoojaSubscription.js
 *
 * After running, copy the printed RAZORPAY_PLAN_ID into backend/.env, then
 * have Pooja complete checkout from the "Subscribe for ₹500/month" button on
 * her portfolio page (the subscription itself is created via checkout, not
 * by this script — Razorpay subscriptions require the customer to authorize
 * the mandate).
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const Razorpay = require("razorpay");

const PORTFOLIO_SLUG = "pooja";
const CUSTOMER_NAME = "Pooja";
const CUSTOMER_EMAIL = "pooja.sathishkn@gmail.com";
const AMOUNT_PAISE = 500 * 100;

async function main() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("❌ RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set in backend/.env");
    process.exit(1);
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  let planId = process.env.RAZORPAY_PLAN_ID;

  if (planId) {
    console.log(`ℹ️  Using existing RAZORPAY_PLAN_ID from env: ${planId}`);
  } else {
    console.log("Creating Razorpay plan: ₹500/month INR...");
    const plan = await razorpay.plans.create({
      period: "monthly",
      interval: 1,
      item: {
        name: "Portfolio Display Subscription",
        amount: AMOUNT_PAISE,
        currency: "INR",
        description: `Monthly subscription for ${CUSTOMER_NAME}'s portfolio (${PORTFOLIO_SLUG})`,
      },
      notes: {
        portfolioSlug: PORTFOLIO_SLUG,
      },
    });
    planId = plan.id;
    console.log(`✅ Plan created: ${planId}`);
  }

  console.log("\nNext steps:");
  console.log(`1. Set RAZORPAY_PLAN_ID=${planId} in backend/.env`);
  console.log("2. Configure a Razorpay webhook pointing to:");
  console.log("   POST /api/subscription/webhook");
  console.log("   Events: subscription.authenticated, subscription.activated,");
  console.log("           subscription.charged, subscription.pending,");
  console.log("           subscription.halted, subscription.cancelled,");
  console.log("           subscription.completed, subscription.expired, payment.failed");
  console.log("3. Copy the webhook secret into RAZORPAY_WEBHOOK_SECRET in backend/.env");
  console.log(
    `4. Have ${CUSTOMER_NAME} (${CUSTOMER_EMAIL}) visit her portfolio page and click\n   "Subscribe for ₹500/month" to authorize the recurring mandate.`
  );
}

main().catch((err) => {
  console.error("❌ Setup failed:", err?.error || err);
  process.exit(1);
});
