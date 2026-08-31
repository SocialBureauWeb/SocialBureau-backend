const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const userAuthentication = require("../middlewares/userAuthentication");
const isAdmin = require("../middlewares/isAdmin");

// ─── Public ──────────────────────────────────────────────────────────────
router.get(
  "/portfolio/:slug/visible",
  subscriptionController.getPortfolioVisibility
);
router.post("/checkout", subscriptionController.initCheckout);
router.post("/verify", subscriptionController.verifySubscriptionPayment);

// ─── Admin ───────────────────────────────────────────────────────────────
router.get(
  "/:slug/status",
  userAuthentication,
  isAdmin,
  subscriptionController.getStatus
);

// ─── Webhook (Razorpay) — no auth, signature verified in controller ──────
router.post("/webhook", subscriptionController.handleWebhook);

module.exports = router;