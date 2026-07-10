const Billing = require("../models/BillingModel");
const BillingPaymentHistory = require("../models/BillingPaymentHistoryModel");
const Client = require("../models/clientModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const {
  sendPaymentCreatedEmail,
  sendPaymentUpdatedEmail,
  sendPaymentPaidEmail,
  sendPaymentReminderEmail,
  sendPaymentOverdueEmail,
} = require("../services/billingEmailService");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Admin: Create Payment ──────────────────────────────────────────────────
exports.createPayment = async (req, res) => {
  try {
    const { clientId, title, description, amount, dueDate, type, recurring, razorpayEnabled } = req.body;

    // Validate required fields
    if (!clientId || !title || amount == null || !dueDate) {
      return res.status(400).json({
        error: "clientId, title, amount, and dueDate are required",
      });
    }

    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Create billing record
    const billing = new Billing({
      clientId,
      title,
      description,
      amount,
      dueDate,
      type: type || "one_time",
      recurring: recurring || false,
      razorpayEnabled: razorpayEnabled || false,
      createdBy: req.user._id,
    });

    await billing.save();

    // Send email notification
    try {
      await sendPaymentCreatedEmail({
        clientEmail: client.email,
        clientName: client.name,
        payment: billing.toObject(),
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    // Create in-app notification
    try {
      await Notification.create({
        userId: clientId,
        type: "payment_created",
        title: `New Payment: ${title}`,
        description: `A new payment of ₹${amount} has been created for you.`,
        referenceId: billing._id,
        referenceType: "Billing",
        isRead: false,
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    res.status(201).json({
      message: "Payment created successfully",
      data: billing,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
};

// ─── Admin: Get All Payments ────────────────────────────────────────────────
exports.getAllPayments = async (req, res) => {
  try {
    const { clientId, status, month, skip = 0, limit = 20 } = req.query;

    let filter = { isDeleted: false };

    if (clientId) {
      filter.clientId = clientId;
    }

    if (status) {
      filter.status = status;
    }

    if (month) {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(`${year}-${monthNum}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      filter.dueDate = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const total = await Billing.countDocuments(filter);
    const payments = await Billing.find(filter)
      .populate("clientId", "name email")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res.json({
      data: payments,
      total,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// ─── Admin: Get Payment by ID ───────────────────────────────────────────────
exports.getPaymentById = async (req, res) => {
  try {
    const billing = await Billing.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate("clientId")
      .populate("createdBy", "name")
      .populate("updatedBy", "name");

    if (!billing) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json({ data: billing });
  } catch (error) {
    console.error("Error fetching payment:", error);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
};

// ─── Admin: Update Payment ──────────────────────────────────────────────────
exports.updatePayment = async (req, res) => {
  try {
    const { title, description, amount, dueDate, type, recurring, razorpayEnabled } = req.body;

    const billing = await Billing.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("clientId");

    if (!billing) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Update fields
    if (title) billing.title = title;
    if (description !== undefined) billing.description = description;
    if (amount) billing.amount = amount;
    if (dueDate) billing.dueDate = dueDate;
    if (type) billing.type = type;
    if (recurring !== undefined) billing.recurring = recurring;
    if (razorpayEnabled !== undefined) billing.razorpayEnabled = razorpayEnabled;

    billing.updatedBy = req.user._id;
    await billing.save();

    // Send email notification
    try {
      await sendPaymentUpdatedEmail({
        clientEmail: billing.clientId.email,
        clientName: billing.clientId.name,
        payment: billing.toObject(),
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    // Create in-app notification
    try {
      await Notification.create({
        userId: billing.clientId._id,
        type: "payment_updated",
        title: `Payment Updated: ${title || billing.title}`,
        description: `Your payment has been updated.`,
        referenceId: billing._id,
        referenceType: "Billing",
        isRead: false,
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    res.json({
      message: "Payment updated successfully",
      data: billing,
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ error: "Failed to update payment" });
  }
};

// ─── Admin: Mark Payment as Paid ────────────────────────────────────────────
exports.markPaymentAsPaid = async (req, res) => {
  try {
    const { paidAmount } = req.body;

    const billing = await Billing.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("clientId");

    if (!billing) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (billing.status === "paid") {
      return res.status(400).json({ error: "Payment is already marked as paid" });
    }

    billing.status = "paid";
    billing.paidAt = new Date();
    billing.paidAmount = paidAmount || billing.amount;
    billing.reminderSent = true;
    billing.overdueSent = true;
    billing.updatedBy = req.user._id;
    await billing.save();

    // Send email notification
    try {
      await sendPaymentPaidEmail({
        clientEmail: billing.clientId.email,
        clientName: billing.clientId.name,
        payment: billing.toObject(),
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    // Create in-app notification
    try {
      await Notification.create({
        userId: billing.clientId._id,
        type: "payment_marked_paid",
        title: `Payment Confirmed: ${billing.title}`,
        description: `Your payment of ₹${billing.amount} has been marked as paid.`,
        referenceId: billing._id,
        referenceType: "Billing",
        isRead: false,
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    res.json({
      message: "Payment marked as paid successfully",
      data: billing,
    });
  } catch (error) {
    console.error("Error marking payment as paid:", error);
    res.status(500).json({ error: "Failed to mark payment as paid" });
  }
};

// ─── Admin: Soft Delete Payment ─────────────────────────────────────────────
exports.deletePayment = async (req, res) => {
  try {
    const billing = await Billing.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!billing) {
      return res.status(404).json({ error: "Payment not found" });
    }

    billing.isDeleted = true;
    billing.updatedBy = req.user._id;
    await billing.save();

    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ error: "Failed to delete payment" });
  }
};

// ─── Client: Get Own Payments ───────────────────────────────────────────────
exports.getMyPayments = async (req, res) => {
  try {
    const { status, skip = 0, limit = 20 } = req.query;

    // Get client ID from user
    const user = await User.findById(req.user._id);
    if (!user || !user.clientId) {
      return res.status(400).json({ error: "User is not associated with a client" });
    }

    let filter = { clientId: user.clientId, isDeleted: false };

    if (status) {
      filter.status = status;
    }

    const total = await Billing.countDocuments(filter);
    const payments = await Billing.find(filter)
      .sort({ dueDate: 1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res.json({
      data: payments,
      total,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// ─── Admin: Get Dashboard Cards ─────────────────────────────────────────────
exports.getDashboardCards = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate start and end of today
    const startOfToday = today;
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const [totalPending, totalPaid, totalOverdue, dueTodayCount, totalAmount] = await Promise.all([
      Billing.countDocuments({ status: "pending", isDeleted: false }),
      Billing.countDocuments({ status: "paid", isDeleted: false }),
      Billing.countDocuments({ status: "overdue", isDeleted: false }),
      Billing.countDocuments({
        dueDate: { $gte: startOfToday, $lte: endOfToday },
        status: { $ne: "paid" },
        isDeleted: false,
      }),
      Billing.aggregate([
        {
          $match: { status: "pending", isDeleted: false },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const pendingAmount = totalAmount[0]?.total || 0;

    res.json({
      data: {
        totalPending,
        totalPaid,
        totalOverdue,
        dueTodayCount,
        pendingAmount,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard cards:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
};

// ─── Client: Create Razorpay Order ──────────────────────────────────────────
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { billingId } = req.body;

    if (!billingId) {
      return res.status(400).json({ error: "billingId is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.clientId) {
      return res.status(400).json({ error: "User is not associated with a client" });
    }

    const billing = await Billing.findOne({
      _id: billingId,
      clientId: user.clientId,
      isDeleted: false,
    });

    if (!billing) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (!billing.razorpayEnabled) {
      return res.status(400).json({ error: "Razorpay is not enabled for this payment" });
    }

    if (billing.status === "paid") {
      return res.status(400).json({ error: "Payment is already marked as paid" });
    }

    // Create order
    const order = await razorpay.orders.create({
      amount: Math.round(billing.amount * 100), // Amount in paise
      currency: "INR",
      receipt: `billing_${billing._id}`,
      notes: {
        billingId: billing._id.toString(),
        clientId: user.clientId.toString(),
        title: billing.title,
      },
    });

    res.json({
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
};

// ─── Client: Verify Razorpay Payment ────────────────────────────────────────
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, billingId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !billingId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.clientId) {
      return res.status(400).json({ error: "User is not associated with a client" });
    }

    // Verify signature
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const digest = hmac.digest("hex");

    if (digest !== razorpaySignature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await razorpay.payments.fetch(razorpayPaymentId);

    if (paymentDetails.status !== "captured") {
      return res.status(400).json({ error: "Payment not captured" });
    }

    // Update billing record
    const billing = await Billing.findOne({
      _id: billingId,
      clientId: user.clientId,
      isDeleted: false,
    }).populate("clientId");

    if (!billing) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Create payment history record
    const paymentHistory = new BillingPaymentHistory({
      billingId: billing._id,
      clientId: user.clientId,
      razorpayPaymentId,
      razorpayOrderId,
      amount: paymentDetails.amount / 100, // Convert from paise
      currency: paymentDetails.currency,
      status: "captured",
      method: paymentDetails.method,
      receipt: paymentDetails.receipt,
      notes: paymentDetails.notes,
    });

    await paymentHistory.save();

    // Update billing status
    billing.status = "paid";
    billing.paidAt = new Date();
    billing.razorpayPaymentId = razorpayPaymentId;
    billing.paidAmount = paymentDetails.amount / 100;
    billing.reminderSent = true;
    billing.overdueSent = true;
    await billing.save();

    // Send email notification
    try {
      await sendPaymentPaidEmail({
        clientEmail: billing.clientId.email,
        clientName: billing.clientId.name,
        payment: billing.toObject(),
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
    }

    // Create in-app notification
    try {
      await Notification.create({
        userId: user.clientId,
        type: "payment_marked_paid",
        title: `Payment Confirmed: ${billing.title}`,
        description: `Your payment of ₹${billing.amount} has been confirmed.`,
        referenceId: billing._id,
        referenceType: "Billing",
        isRead: false,
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
    }

    res.json({
      message: "Payment verified successfully",
      data: {
        billing,
        paymentHistory,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Failed to verify payment" });
  }
};

// ─── Admin: Get Payment History ─────────────────────────────────────────────
exports.getPaymentHistory = async (req, res) => {
  try {
    const { billingId, skip = 0, limit = 20 } = req.query;

    let filter = { isDeleted: false };

    if (billingId) {
      filter.billingId = billingId;
    }

    const total = await BillingPaymentHistory.countDocuments(filter);
    const history = await BillingPaymentHistory.find(filter)
      .populate("billingId")
      .populate("clientId")
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    res.json({
      data: history,
      total,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
};
