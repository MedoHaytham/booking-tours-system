const mongoose = require('mongoose');

const favoritesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

favoritesSchema.pre(/^find/, function () {
  this.populate('userId').populate('tourId', 'name slug');
});

const Favorites = mongoose.model('Favorites', favoritesSchema);
module.exports = Favorites;