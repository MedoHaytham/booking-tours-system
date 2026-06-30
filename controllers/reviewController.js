const Review = require('../models/reviews');
const factory = require('./handlerFactory');
const asyncWrapper = require('../utils/asyncWrapper');
const httpStatus = require('../utils/httpStatusText');
const Booking = require('../models/bookings');
const AppError = require('../utils/appError');

// handlers
exports.getAllReviews = factory.getAll(Review, ['review']);
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

exports.checkIfTourBoughtAndPassed = asyncWrapper(
  async (req, res, next) => {
    const bookedTour = await Booking.findOne({
      tour: req.body.tour, 
      user: req.currentUser._id,
      paid: true,
      date: { $lte: new Date() }
    });

    if (!bookedTour) {
      return next(new AppError('You must buy the tour before reviewing it', 400));
    }
    if (bookedTour.date > new Date()) {
      return next(new AppError('You must have enjoyed the tour before reviewing it', 400));
    }
    next();
  }
);

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

exports.getReviewsStats = asyncWrapper(async (req, res, next) => {
  const stats = await Review.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
      }
    }
  ]);

  const result = stats[0] || {
    total: 0,
    avgRating: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStar: 0
  };

  res.status(200).json({
    status: httpStatus.SUCCESS,
    data: result
  });
});