// const mongoose = require("mongoose");

// const subscriberSchema = new mongoose.Schema(
// 	{
// 		email: {
// 			type: String,
// 			required: true,
// 			unique: true,
// 			lowercase: true,
// 			trim: true,
// 		},
// 		isActive: {
// 			type: Boolean,
// 			default: true,
// 		},
// 	},
// 	{ timestamps: true }
// );

// module.exports = mongoose.model("Subscriber", subscriberSchema);



// models/Subscriber.js
const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  subscribedAt: {
    type: Date,
    default: Date.now,
  },
  unsubscribedAt: {
    type: Date,
    default: null,
  },
  lastEmailSentAt: {
    type: Date,
    default: null,
  },
  emailCount: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Index for faster queries
subscriberSchema.index({ email: 1 });
subscriberSchema.index({ isActive: 1 });

module.exports = mongoose.model("Subscriber", subscriberSchema);