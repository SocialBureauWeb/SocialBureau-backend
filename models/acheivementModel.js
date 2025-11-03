const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    user: {
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
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    badge: {
      type: String,
      trim: true,
    },
    dateEarned: {
      type: Date,
      default: Date.now,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
const Achievement = mongoose.model("Achievement", achievementSchema);

module.exports = Achievement;