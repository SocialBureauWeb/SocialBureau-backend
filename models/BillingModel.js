const mongoose = require("mongoose");

const BillingSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ["monthly", "one_time"],
      default: "one_time",
    },
    recurring: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
      index: true,
    },
    razorpayEnabled: {
      type: Boolean,
      default: false,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
    },
    paidAt: {
      type: Date,
      sparse: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    overdueSent: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Index for common queries
BillingSchema.index({ clientId: 1, isDeleted: 1 });
BillingSchema.index({ status: 1, isDeleted: 1 });
BillingSchema.index({ dueDate: 1, isDeleted: 1 });
BillingSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Billing", BillingSchema);
