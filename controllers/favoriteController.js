const asyncWrapper = require('../utils/asyncWrapper');
const Favorites = require('../models/favorites');
const Tour = require('../models/tours');
const httpStatus = require('../utils/httpStatusText');

exports.toggleFavorite = asyncWrapper(
  async (req, res, next) => {
    const { tourId } = req.params;
    const userId = req.currentUser._id;

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
  async (req, res, next)=> {
    const favorites = await Favorites.find({ userId: req.currentUser._id });

    const tourIDs = favorites.map( favorite => favorite.tourId );
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).json({
      status: httpStatus.SUCCESS,
      length: tours.length,
      data: {
        tours
      }
    });
  }
);




