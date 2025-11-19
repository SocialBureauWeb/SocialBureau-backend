const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      required: true,
      match: [
        // basic email regex — adjust if you need stricter validation
        /^\S+@\S+\.\S+$/,
        "Please provide a valid email address",
      ],
      index: true,
    },
    review: {
      type: String,
      trim: true,
      required: true,
    },
    // use plural or "rating" to be clearer than "point"
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "rating must be an integer",
      },
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },

    approved: {
      type: Boolean,
      default: false,
      index: true,
    },

    meta: {
      // place for future metadata (e.g., reported, helpful votes)
      helpful: { type: Number, default: 0, min: 0 },
      reported: { type: Number, default: 0, min: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;