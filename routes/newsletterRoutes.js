// const express = require("express");
// const router = express.Router();

// const {
//   subscribeNewsletter,
//   sendTestNewsletter,
// } = require("../controllers/newsLetterController");

// router.post("/subscribe", subscribeNewsletter);

// // ✅ ADD THIS
// router.post("/send-test", sendTestNewsletter);

// module.exports = router;



// routes/newsLetterRoutes.js
const express = require("express");
const router = express.Router();

const {
  subscribeNewsletter,
  sendTestNewsletter,
  getSubscriberCount,
  unsubscribeNewsletter,
} = require("../controllers/newsLetterController");

// Public routes
router.post("/subscribe", subscribeNewsletter);
router.post("/unsubscribe", unsubscribeNewsletter);

// Admin/Testing routes (add auth middleware if needed)
router.post("/send-test", sendTestNewsletter);
router.get("/stats", getSubscriberCount);

module.exports = router;