const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    user: {
      // optional: reference to a User in your system (keep if you track owner)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
      unique: true,
    },
    excerpt: {
      type: String,
      trim: true,
    },
    content: {
      // array of strings, as in your sample
      type: [String],
      default: [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "content must be a non-empty array of strings",
      },
    },
    authorName: {
      type: String,
      trim: true,
      required: true,
    },
    authorRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    readingTime: {
      // stores values like "7 min read"
      type: String,
      trim: true,
    },
    image: {
      type: String, // path or URL
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
      default: "general",
    },
    published: {
      type: Boolean,
      default: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    meta: {
      // place for future metadata (SEO, promos...)
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
