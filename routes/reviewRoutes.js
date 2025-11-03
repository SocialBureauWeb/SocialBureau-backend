const express = require("express");
const reviewController = require("../controllers/reviewController");
const reviewRoutes = express.Router();

reviewRoutes.post('/add', reviewController.createReview);
reviewRoutes.get('/view', reviewController.listReviews);
reviewRoutes.get('/reviews/:id', reviewController.getReviewById);
reviewRoutes.patch('/reviews/:id', reviewController.updateReview);
reviewRoutes.delete('/reviews/:id', reviewController.deleteReview);
reviewRoutes.post('/approve/:id', reviewController.approveReview);
reviewRoutes.get('/ratings', reviewController.getEmployeeRatingSummary);

module.exports = reviewRoutes;

