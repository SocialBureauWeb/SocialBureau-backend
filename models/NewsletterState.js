// // models/NewsletterState.js
// const mongoose = require("mongoose");

// const newsletterStateSchema = new mongoose.Schema({
//   lastSentBlogId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Blog",
//   },
// }, { timestamps: true });

// module.exports = mongoose.model("NewsletterState", newsletterStateSchema);




// models/NewsletterState.js
const mongoose = require("mongoose");

const newsletterStateSchema = new mongoose.Schema({
  lastSentBlogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blog",
    default: null,
  },
  lastSentAt: {
    type: Date,
    default: null,
  },
  lastSentJobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    default: null,
  },
  totalEmailsSent: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model("NewsletterState", newsletterStateSchema);