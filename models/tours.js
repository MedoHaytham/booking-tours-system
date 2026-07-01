/* eslint-disable no-console */
const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'tour must have a name'],
    unique: true,
    trim: true,
    minlength: [10, 'a tour must have a name at least 10 characters long'],
    maxlength: [40, 'a tour must have a name at most 40 characters long'],
    // validate: [validator.isAlpha, 'tour name must contain only characters']
  },
  slug: {
    type: String,
  },
  duration: {
    type: Number,
    required: [true, 'tour must have a duration']
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'tour must have a max group size']
  },
  difficulty: {
    type: String,
    required: [true, 'tour must have a difficulty'],
    enum: {
      values: ['easy', 'medium', 'difficult'],
      message: 'difficulty is either easy, medium or difficult',
    }
  },
  ratingsAverage: {
    type: Number,
    default: 4.5, // 0
    min: [1, 'rating must be above 1.0'],
    max: [5, 'rating must be below 5.0'],
    set: val => Math.round( val * 10 ) / 10
  },
  ratingsQuantity: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'tour must have a price']
  },
  priceDiscount: {
    type: Number,
    validate: {
      validator: function(val) {
        // this only points to the current document on new document creation and not when updating
        return val < this.price;
      },
      message: 'Discount price ({VALUE}) should be below than regular price',
    }
  },
  summary: {
    type: String,
    trim: true,
    required: [true, 'tour must have a summary']
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'tour must have a description']
  },
  imageCover: {
    type: String,
    required: [true, 'tour must have an image cover'],
  },
  images: {
    type: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  startDates: [
    {
      startDate: {
        type: Date,
        required: [true, 'tour must have a start date']
      },
      participants: {
        type: Number,
        default: 0
      },
      soldOut: {
        type: Boolean,
        default: false
      },
    }
  ],
  secretTour: {
    type: Boolean,
    default: false,
  },
  startLocation: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: [Number],
    address: String,
    description: String,
  },
  locations: [
    {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number,
    }
  ],
  guides: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  available: {
    type: Boolean,
    default: true
  }
}, 
{ 
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

// Virtual property
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// tourSchema.virtual('available').get(function() {
//   if (!this.startDates || this.startDates.length === 0) return false;
//   const now = new Date();
//   return this.startDates.some(date => !date.soldOut && date.startDate > now);
// });

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

// Document middleware: run before .save() and .create() not update
tourSchema.pre('save', function() {
  this.slug = slugify(this.name, { lower: true });
});

tourSchema.pre('save', function() {
  if (this.startDates && this.startDates.length > 0) {
    this.available = this.startDates.some(date => !date.soldOut && date.startDate > new Date());
  } else {
    this.available = false;
  }
});

// tourSchema.pre('save', () => {
//   console.log('will save doc...');
// });

// tourSchema.post('save', (doc) =>{
//   console.log(doc);
// });

// Query middleware
tourSchema.pre(/^find/, function() {
  this.find({ secretTour: { $ne: true} });
  this.start = Date.now();
});

tourSchema.pre(/^find/, function() {
  this.populate(
    {
      path: 'guides', 
      select: '-__v -passwordChangedAt'
    });
});

// tourSchema.post(/^find/, function() {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);
// });

// Aggregation middleware
// tourSchema.pre('aggregate', function() {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
// });

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;