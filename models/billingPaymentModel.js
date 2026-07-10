const mongoose = require("mongoose");

const billingPaymentSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
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
      default: null,
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Cron tracking: date of last due reminder sent
    lastReminderSent: {
      type: Date,
      default: null,
    },
    // Cron tracking: how many overdue reminders have been sent
    overdueReminderCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index for admin list queries
billingPaymentSchema.index({ isDeleted: 1, status: 1, dueDate: -1 });
billingPaymentSchema.index({ clientId: 1, isDeleted: 1, status: 1 });

module.exports = mongoose.model("BillingPayment", billingPaymentSchema);
