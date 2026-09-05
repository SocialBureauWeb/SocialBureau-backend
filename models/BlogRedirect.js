const mongoose = require('mongoose');

const blogRedirectSchema = new mongoose.Schema(
  {
    sourceSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
      unique: true,
    },
    targetSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    sourcePath: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    targetPath: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const BlogRedirect = mongoose.model('BlogRedirect', blogRedirectSchema);

module.exports = BlogRedirect;
