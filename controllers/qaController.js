const mongoose = require('mongoose');
const QA = require('../models/qaModel');
const expressAsyncHandler = require('express-async-handler');

function sendError(res, status = 400, message = 'Bad Request', details = null) {
  const payload = { success: false, message };
  if (details) payload.details = details;
  return res.status(status).json(payload);
}

const qaController = {
  // Create a new Q&A thread
  createQuestion: expressAsyncHandler(async (req, res) => {
    try {
      const { title, body, category, author } = req.body;

      if (!title) return sendError(res, 400, 'Title is required');
      if (!body) return sendError(res, 400, 'Body is required');

      const newQA = new QA({
        title,
        body,
        category: category || 'General',
        author: author || { name: 'Anonymous', email: '' },
        status: 'approved', // Auto-approve for now, add moderation later
      });

      const saved = await newQA.save();
      return res.status(201).json({ success: true, data: saved });
    } catch (err) {
      console.error('createQuestion error', err);
      return sendError(res, 500, 'Internal server error', err.message);
    }
  }),

  // List all Q&A threads with filters
  listQuestions: expressAsyncHandler(async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        sort = '-createdAt',
        category,
        answered,
        status = 'approved',
        q,
      } = req.query;

      const p = Math.max(1, parseInt(page, 10) || 1);
      const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

      const filter = {};

      if (status) filter.status = status;
      if (category && category !== 'All') filter.category = category;
      if (answered !== undefined) {
        filter.answered = answered === 'true' || answered === '1';
      }

      if (q) {
        filter.$text = { $search: q };
      }

      const skip = (p - 1) * l;

      const [items, total] = await Promise.all([
        QA.find(filter).skip(skip).limit(l).sort(sort).lean(),
        QA.countDocuments(filter),
      ]);

      return res.json({
        success: true,
        meta: {
          page: p,
          limit: l,
          total,
          pages: Math.ceil(total / l),
        },
        data: items,
      });
    } catch (err) {
      console.error('listQuestions error', err);
      return sendError(res, 500, 'Internal server error', err.message);
    }
  }),

  // Get single Q&A by ID
  getQuestionById: expressAsyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id))
        return sendError(res, 400, 'Invalid question ID');

      const qa = await QA.findById(id).lean();
      if (!qa) return sendError(res, 404, 'Question not found');

      return res.json({ success: true, data: qa });
    } catch (err) {
      console.error('getQuestionById error', err);
      return sendError(res, 500, 'Internal server error', err.message);
    }
  }),

  // Upvote a question
  upvoteQuestion: expressAsyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body; // IP address or user ID

      if (!mongoose.Types.ObjectId.isValid(id))
        return sendError(res, 400, 'Invalid question ID');

      const qa = await QA.findById(id);
      if (!qa) return sendError(res, 404, 'Question not found');

      // Check if already upvoted
      if (qa.upvotedBy.includes(userId)) {
        return sendError(res, 400, 'Already upvoted this question');
      }

      qa.votes += 1;
      qa.upvotedBy.push(userId);
      await qa.save();

      return res.json({ success: true, data: qa });
    } catch (err) {
      console.error('upvoteQuestion error', err);
      return sendError(res, 500, 'Internal server error', err.message);
    }
  }),

  // Mark question as answered
  markAnswered: expressAsyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { expert, expertAnswer } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id))
        return sendError(res, 400, 'Invalid question ID');

      const updated = await QA.findByIdAndUpdate(
        id,
        {
          answered: true,
          expert: expert || 'SocialBureau Expert',
          expertAnswer: expertAnswer || null,
        },
        { new: true }
      ).lean();

      if (!updated) return sendError(res, 404, 'Question not found');

      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error('markAnswered error', err);
      return sendError(res, 500, 'Internal server error', err.message);
    }
  }),

  // Update question
  updateQuestion: expressAsyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id))
        return sendError(res, 400, 'Invalid question ID');

      const allowed = ['title', 'body', 'category', 'status'];
      const updates = {};
      allowed.forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(req.body, k))
          updates[k] = req.body[k];
      });

      const updated = await QA.findByIdAndUpdate(id, updates, {
        new: true,
      }).lean();
      if (!updated) return sendError(res, 404, 'Question not found');

      return res.json({ success: true, data: updated });
    } catch (err) {
      console.error('updateQuestion error', err);
      return sendError(res, 500, 'Internal server error', err.message);
    }
  }),

  // Delete question
  deleteQuestion: expressAsyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id))
        return sendError(res, 400, 'Invalid question ID');

      const removed = await QA.findByIdAndDelete(id).lean();
      if (!removed) return sendError(res, 404, 'Question not found');

      return res.json({ success: true, data: removed });
    } catch (err) {
      console.error('deleteQuestion error', err);
      return sendError(res, 500, 'Internal server error', err.message);
    }
  }),

  // Get stats
  getStats: expressAsyncHandler(async (req, res) => {
    try {
      const [totalThreads, answeredThreads] = await Promise.all([
        QA.countDocuments({ status: 'approved' }),
        QA.countDocuments({ status: 'approved', answered: true }),
      ]);

      const stats = {
        threads: totalThreads,
        answered: answeredThreads,
        experts: 12, // Static for now, can be dynamic later
      };

      return res.json({ success: true, data: stats });
    } catch (err) {
      console.error('getStats error', err);
      return sendError(res, 500, 'Internal server error', err.message);
    }
  }),
};

module.exports = qaController;
