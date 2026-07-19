const asyncWrapper = require('../utils/asyncWrapper');
const Favorites = require('../models/favorites');
const httpStatus = require('../utils/httpStatusText');
const AppError = require('../utils/appError');
const Tour = require('../models/tours');

exports.toggleFavorite = asyncWrapper(
  async (req, res, next) => {
    const { tourId } = req.params;
    const userId = req.currentUser._id;

    const tourExists = await Tour.exists({ _id: tourId });
    if (!tourExists) {
      return next(new AppError('No tour found with that ID', 404));
    }

    const existing = await Favorites.findOne({ tourId, userId });

    if (existing) {
      await existing.deleteOne();
      return res.status(200).json({
        status: httpStatus.SUCCESS,
        favorited: false
      });
    }

    await Favorites.create({ tourId, userId });
    res.status(201).json({
      status: httpStatus.SUCCESS,
      favorited: true
    });
  }
);

exports.myFavorites = asyncWrapper(
  async (req, res, next) => {
    const favorites = await Favorites.find({ userId: req.currentUser._id }).populate('tourId');

    const tours = favorites.map(favorite => favorite.tourId);

    res.status(200).json({
      status: httpStatus.SUCCESS,
      length: tours.length,
      data: {
        tours
      }
    });
  }
);