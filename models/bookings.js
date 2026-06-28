const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!']
  },
  date: {
    type: Date,
    required: [true, 'Booking must have a date.']
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price.']
  },
  sessionId: {
    type: String,
    unique: true,
    required: [true, 'Booking must have a session id.']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  paid: {
    type: Boolean,
    default: true
  }
});

bookingSchema.index({ tour: 1, user: 1 });


// Query middleware
bookingSchema.pre(/^find/, function(){
  this.populate('user').populate('tour', 'name');
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;