const express = require('express');
const blogController = require('../controllers/blogController');
const upload = require('../middlewares/cloudinary');
const blogRoutes = express.Router();

// Create new blog (with multiple image uploads - main image + section images)
blogRoutes.post('/blogs', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'sectionImage_0', maxCount: 1 },
  { name: 'sectionImage_1', maxCount: 1 },
  { name: 'sectionImage_2', maxCount: 1 },
  { name: 'sectionImage_3', maxCount: 1 },
  { name: 'sectionImage_4', maxCount: 1 },
  { name: 'sectionImage_5', maxCount: 1 },
  { name: 'sectionImage_6', maxCount: 1 },
  { name: 'sectionImage_7', maxCount: 1 },
  { name: 'sectionImage_8', maxCount: 1 },
  { name: 'sectionImage_9', maxCount: 1 },
]), blogController.createBlog);

// Get latest blogs (MUST be before /:slug route)
blogRoutes.get('/blogs/latest', blogController.getLatestBlogs);

// List all blogs
blogRoutes.get('/blogs', blogController.listBlogs);

// Get stats
blogRoutes.get('/stats', blogController.getStats);

// Get single blog by slug (MUST be after /latest route)
blogRoutes.get('/blogs/:slug', blogController.getBlogBySlug);

// Update blog
blogRoutes.patch('/blogs/:slug', blogController.updateBlog);

// Delete blog
blogRoutes.delete('/blogs/:slug', blogController.deleteBlog);

module.exports = blogRoutes;
