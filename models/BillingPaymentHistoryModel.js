const mongoose = require("mongoose");

const BillingPaymentHistorySchema = new mongoose.Schema(
  {
    billingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Billing",
      required: true,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      index: true,
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
    status: {
      type: String,
      enum: ["pending", "captured", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    method: {
      type: String,
      trim: true,
    },
    receipt: {
      type: String,
      trim: true,
    },
    notes: {
      type: mongoose.Schema.Types.Mixed,
    },
    failureReason: {
      type: String,
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BillingPaymentHistory", BillingPaymentHistorySchema);
