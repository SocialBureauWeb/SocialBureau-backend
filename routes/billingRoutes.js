const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");
const userAuthentication = require("../middlewares/userAuthentication");
const { isBillingManager, canViewBilling } = require("../middlewares/billingPermission");

// ─── Admin Routes ────────────────────────────────────────────────────────────

// Create payment
router.post(
  "/admin/payments",
  userAuthentication,
  isBillingManager,
  billingController.createPayment
);

// Get all payments (with filters)
router.get(
  "/admin/payments",
  userAuthentication,
  canViewBilling,
  billingController.getAllPayments
);

// Get payment by ID
router.get(
  "/admin/payments/:id",
  userAuthentication,
  canViewBilling,
  billingController.getPaymentById
);

// Update payment
router.put(
  "/admin/payments/:id",
  userAuthentication,
  isBillingManager,
  billingController.updatePayment
);

// Mark payment as paid
router.patch(
  "/admin/payments/:id/mark-paid",
  userAuthentication,
  isBillingManager,
  billingController.markPaymentAsPaid
);

// Soft delete payment
router.delete(
  "/admin/payments/:id",
  userAuthentication,
  isBillingManager,
  billingController.deletePayment
);

// Get dashboard cards
router.get(
  "/admin/dashboard/cards",
  userAuthentication,
  canViewBilling,
  billingController.getDashboardCards
);

// Get payment history
router.get(
  "/admin/payments/history/list",
  userAuthentication,
  canViewBilling,
  billingController.getPaymentHistory
);

// ─── Client Routes ───────────────────────────────────────────────────────────

// Get own payments
router.get(
  "/client/payments",
  userAuthentication,
  billingController.getMyPayments
);

// Create Razorpay order
router.post(
  "/client/razorpay/create-order",
  userAuthentication,
  billingController.createRazorpayOrder
);

// Verify Razorpay payment
router.post(
  "/client/razorpay/verify",
  userAuthentication,
  billingController.verifyRazorpayPayment
);

module.exports = router;
