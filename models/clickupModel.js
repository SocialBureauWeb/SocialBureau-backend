const mongoose = require("mongoose");

const clickupSchema = new mongoose.Schema(
  {
    // ClickUp's unique ID for the task/item (keep as string)
    clickupId: {
      type: String,
      required: true,
      trim: true,
      index: true,
      unique: true,
    },

    // Human-readable name/title
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Status label from ClickUp (kept flexible)
    status: {
      type: String,
      trim: true,
      default: "open",
    },

    // Time tracked in seconds (use seconds for precision)
    timeTracked: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional reference to a local user (if you track owners in your app)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    // Optional fields commonly useful for tasks
    description: {
      type: String,
      trim: true,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    dueDate: {
      type: Date,
    },

    // Keep original ClickUp payload for debugging / future fields
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Clickup = mongoose.model("Clickup", clickupSchema);

module.exports = Clickup;