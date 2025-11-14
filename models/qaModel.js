const mongoose = require('mongoose');

const qaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    body: {
      type: String,
      required: [true, 'Question body is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['General', 'Meta', 'Google', 'Content', 'API', 'Tools', 'Strategy'],
      default: 'General',
    },
    votes: {
      type: Number,
      default: 0,
    },
    answered: {
      type: Boolean,
      default: false,
    },
    expert: {
      type: String,
      default: null,
    },
    expertAnswer: {
      type: String,
      default: null,
    },
    author: {
      name: String,
      email: String,
    },
    upvotedBy: [{
      type: String, // Store IPs or user IDs
    }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
qaSchema.index({ title: 'text', body: 'text', category: 'text' });

const QA = mongoose.model('QA', qaSchema);

module.exports = QA;
