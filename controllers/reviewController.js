const Review = require('../models/reviews');
const factory = require('./handlerFactory');
const asyncWrapper = require('../utils/asyncWrapper');
const httpStatus = require('../utils/httpStatusText');

// handlers
exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

// middleware to set tour and user ids when creating review
exports.setTourAndUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.currentUser._id;
  next();
};

exports.getMyReviews = asyncWrapper(
  async (req, res, next) => {
    const reviews = await Review.find({user: req.currentUser._id}).populate('tour', 'name slug');

    res.status(200).json({
      status: httpStatus.SUCCESS,
      results: reviews.length,
      data: {
        reviews
      }
    });
  }
);