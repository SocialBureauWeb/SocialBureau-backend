const crypto = require("crypto");
const Razorpay = require("razorpay");
const PortfolioSubscription = require("../models/PortfolioSubscriptionModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const MONTHLY_AMOUNT_INR = 500;
// Razorpay requires a finite total_count for monthly plans; 120 cycles (10 years)
// effectively behaves as "until cancelled" for our purposes.
const TOTAL_BILLING_CYCLES = 120;

// ─── Public: Portfolio visibility (used to gate the public page) ───────────
exports.getPortfolioVisibility = async (req, res) => {
  try {
    const { slug } = req.params;
    const sub = await PortfolioSubscription.findOne({
      portfolioSlug: slug.toLowerCase(),
    });

    if (!sub) {
      return res.json({ visible: false });
    }

    return res.json({ visible: sub.isPortfolioVisible() });
  } catch (error) {
    console.error("Error checking portfolio visibility:", error);
    res.status(500).json({ error: "Failed to check portfolio visibility" });
  }
};

// ─── Public/User: Start subscription checkout ───────────────────────────────
exports.initCheckout = async (req, res) => {
  try {
    const { portfolioSlug, customerName, customerEmail } = req.body;

    if (!portfolioSlug || !customerName || !customerEmail) {
      return res.status(400).json({
        error: "portfolioSlug, customerName, and customerEmail are required",
      });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ error: "Razorpay is not configured" });
    }

    if (!process.env.RAZORPAY_PLAN_ID) {
      return res.status(500).json({ error: "RAZORPAY_PLAN_ID is not configured" });
    }

    const slug = portfolioSlug.toLowerCase().trim();

    let sub = await PortfolioSubscription.findOne({ portfolioSlug: slug });

    // Reuse an existing subscription if it's still usable (not cancelled/expired).
    if (
      sub &&
      sub.razorpaySubscriptionId &&
      !["cancelled", "completed", "expired"].includes(sub.status)
    ) {
      return res.json({
        keyId: process.env.RAZORPAY_KEY_ID,
        subscriptionId: sub.razorpaySubscriptionId,
        amount: sub.amount,
        currency: sub.currency,
        customerName: sub.customerName,
        customerEmail: sub.customerEmail,
      });
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      total_count: TOTAL_BILLING_CYCLES,
      customer_notify: 1,
      notes: {
        portfolioSlug: slug,
        customerName,
        customerEmail,
      },
    });

    if (!sub) {
      sub = new PortfolioSubscription({
        portfolioSlug: slug,
        customerName,
        customerEmail,
        amount: MONTHLY_AMOUNT_INR,
        currency: "INR",
        billingInterval: "monthly",
      });
    }

    sub.customerName = customerName;
    sub.customerEmail = customerEmail;
    sub.razorpaySubscriptionId = subscription.id;
    sub.razorpayPlanId = process.env.RAZORPAY_PLAN_ID;
    sub.status = subscription.status || "created";
    await sub.save();

    return res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionId: subscription.id,
      amount: sub.amount,
      currency: sub.currency,
      customerName,
      customerEmail,
    });
  } catch (error) {
    console.error("Error initiating subscription checkout:", error);
    res.status(500).json({ error: "Failed to initiate subscription checkout" });
  }
};

// ─── Public/User: Verify checkout response (NOT the source of truth) ───────
// The frontend calls this right after Razorpay checkout completes so the UI
// can reflect the latest state immediately. The subscription status is
// always re-fetched from Razorpay's API (never trusted from the request
// body), and the authoritative state is ultimately reconciled via webhooks.
exports.verifySubscriptionPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id: paymentId,
      razorpay_subscription_id: subscriptionId,
      razorpay_signature: signature,
    } = req.body;

    if (!paymentId || !subscriptionId || !signature) {
      return res.status(400).json({ error: "Missing Razorpay verification fields" });
    }

    const sub = await PortfolioSubscription.findOne({
      razorpaySubscriptionId: subscriptionId,
    });

    if (!sub) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex");

    const isValid =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );

    if (!isValid) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Re-fetch authoritative status from Razorpay rather than trusting the client.
    const razorpaySub = await razorpay.subscriptions.fetch(subscriptionId);

    sub.status = razorpaySub.status;
    sub.lastPaymentId = paymentId;
    if (razorpaySub.current_start) {
      sub.currentPeriodStart = new Date(razorpaySub.current_start * 1000);
    }
    if (razorpaySub.current_end) {
      sub.currentPeriodEnd = new Date(razorpaySub.current_end * 1000);
    }
    await sub.save();

    return res.json({ status: sub.status, visible: sub.isPortfolioVisible() });
  } catch (error) {
    console.error("Error verifying subscription payment:", error);
    res.status(500).json({ error: "Failed to verify subscription payment" });
  }
};

// ─── Admin: Subscription status view ────────────────────────────────────────
exports.getStatus = async (req, res) => {
  try {
    const { slug } = req.params;
    const sub = await PortfolioSubscription.findOne({
      portfolioSlug: slug.toLowerCase(),
    });

    if (!sub) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.json({
      portfolioSlug: sub.portfolioSlug,
      customerName: sub.customerName,
      customerEmail: sub.customerEmail,
      amount: sub.amount,
      currency: sub.currency,
      billingInterval: sub.billingInterval,
      status: sub.status,
      portfolioVisible: sub.isPortfolioVisible(),
      subscriptionId: sub.razorpaySubscriptionId,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ error: "Failed to fetch subscription status" });
  }
};

// ─── Webhook: Razorpay subscription/payment lifecycle events ───────────────
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    if (!signature || !req.rawBody) {
      return res.status(400).json({ error: "Missing signature or raw body" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");

    const isValid =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
      );

    if (!isValid) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const event = req.body;
    const eventId = event.id || `${event.event}-${event.created_at}`;
    const subscriptionEntity = event.payload?.subscription?.entity;
    const paymentEntity = event.payload?.payment?.entity;

    if (!subscriptionEntity?.id) {
      // Not a subscription-related event we care about; acknowledge and skip.
      return res.status(200).json({ received: true });
    }

    const sub = await PortfolioSubscription.findOne({
      razorpaySubscriptionId: subscriptionEntity.id,
    });

    if (!sub) {
      // Unknown subscription (not created by us) — acknowledge without acting.
      return res.status(200).json({ received: true });
    }

    // Idempotency: ignore an event we've already processed for this subscription.
    if (sub.processedEventIds.includes(eventId)) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    switch (event.event) {
      case "subscription.authenticated":
        sub.status = "authenticated";
        break;
      case "subscription.activated":
        sub.status = "active";
        break;
      case "subscription.charged":
        sub.status = "active";
        if (paymentEntity?.id) sub.lastPaymentId = paymentEntity.id;
        break;
      case "subscription.pending":
        sub.status = "pending";
        break;
      case "subscription.halted":
        sub.status = "halted";
        break;
      case "subscription.cancelled":
        sub.status = "cancelled";
        break;
      case "subscription.completed":
        sub.status = "completed";
        break;
      case "subscription.expired":
        sub.status = "expired";
        break;
      case "payment.failed":
        // Recurring charge failed; Razorpay will retry per plan config,
        // and will emit subscription.halted if retries are exhausted.
        break;
      default:
        break;
    }

    if (subscriptionEntity.current_start) {
      sub.currentPeriodStart = new Date(subscriptionEntity.current_start * 1000);
    }
    if (subscriptionEntity.current_end) {
      sub.currentPeriodEnd = new Date(subscriptionEntity.current_end * 1000);
    }

    sub.processedEventIds.push(eventId);
    // Keep the dedupe list bounded.
    if (sub.processedEventIds.length > 200) {
      sub.processedEventIds = sub.processedEventIds.slice(-200);
    }

    await sub.save();

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error handling Razorpay webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};
