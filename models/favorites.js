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

favoritesSchema.index({ userId: 1, tourId: 1 }, { unique: true });

const Favorites = mongoose.model('Favorites', favoritesSchema);
module.exports = Favorites;