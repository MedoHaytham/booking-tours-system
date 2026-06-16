/* eslint-disable prefer-arrow-callback */
const mongoose = require('mongoose');
const Tour = require('./tours');

const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, 'Review can not be empty!'],
  },
  rating: {
    type: Number,
    min: [1, 'rating must be above 1.0'],
    max: [5, 'rating must be below 5.0'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'review must belong to a user']
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'review must belong to a tour']
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Static method: aggregate data from multiple documents to get calculated values
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    { 
      $match: { tour: tourId},
    },
    {
      $group: {
        _id: '$tour',
        nRatings: { $sum: 1},
        avgRatings: { $avg: '$rating' },
      },
    },
  ]);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats.length > 0 ? stats[0].avgRatings : 4.5,
    ratingsQuantity: stats.length > 0 ? stats[0].nRatings : 0,
  });
};

// Document middleware
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.tour);
});

// Query middleware
reviewSchema.post(/^findOneAnd/, async function(doc) {
  if (doc) await doc.constructor.calcAverageRatings(doc.tour);
});

reviewSchema.pre(/^find/, function() {
  this.populate('user', 'name photo');
});


const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;