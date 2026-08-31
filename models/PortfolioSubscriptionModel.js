const mongoose = require("mongoose");

// Tracks a Razorpay recurring subscription that gates public visibility of a
// portfolio page (e.g. /team/pooja). Reusable across portfolio owners via
// `portfolioSlug`.
const PortfolioSubscriptionSchema = new mongoose.Schema(
  {
    portfolioSlug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    razorpayCustomerId: {
      type: String,
      sparse: true,
      index: true,
    },
    razorpaySubscriptionId: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    razorpayPlanId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    billingInterval: {
      type: String,
      enum: ["monthly"],
      default: "monthly",
    },
    status: {
      type: String,
      enum: [
        "created",
        "authenticated",
        "active",
        "pending",
        "halted",
        "cancelled",
        "completed",
        "expired",
      ],
      default: "created",
      index: true,
    },
    currentPeriodStart: {
      type: Date,
    },
    currentPeriodEnd: {
      type: Date,
    },
    lastPaymentId: {
      type: String,
    },
    // Recently processed Razorpay webhook event IDs, used to make webhook
    // handling idempotent (duplicate deliveries are ignored).
    processedEventIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Portfolio is publicly visible only while the subscription is active.
PortfolioSubscriptionSchema.methods.isPortfolioVisible = function () {
  return this.status === "active";
};

module.exports = mongoose.model(
  "PortfolioSubscription",
  PortfolioSubscriptionSchema
);
