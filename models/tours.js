/* eslint-disable no-console */
const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'tour must have a name'],
    unique: true,
    trim: true,
    minlength: [10, 'a tour must have a name at least 10 characters long'],
    maxlength: [40, 'a tour must have a name at most 40 characters long'],
  },
  slug: {
    type: String,
  },
  duration: {
    type: Number,
    required: [true, 'tour must have a duration'],
    min: [ 1, 'duration must be at least 1 day' ],
    max: [ 100, 'duration must be at most 100 days'],
  },
  maxGroupSize: {
    type: Number,
    required: [true, 'tour must have a max group size'],
    min: [ 1, 'maxGroupSize must be above 1'],
    max: [ 25, 'maxGroupSize must be below 25']
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
    required: [true, 'tour must have a summary'],
    minlength: [10, 'a tour must have a summary at least 10 characters long'],
    maxlength: [100, 'a tour must have a summary at most 100 characters long'],
  },
  description: {
    type: String,
    trim: true,
    required: [true, 'tour must have a description'],
    minlength: [10, 'a tour must have a description at least 10 characters long'],
    maxlength: [1000, 'a tour must have a description at most 1000 characters long'],
  },
  imageCover: {
    type: String,
    default: 'default.jpg'
  },
  images: {
    type: [String],
    default: ['default.jpg', 'default.jpg', 'default.jpg'],
    validate: {
      validator: function(val) {
        return val.length <= 3;
      },
      message: 'Tour must have at most 3 images',
    }
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  startDates: {
    type:[
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
      },
    ],
    validate: {
      validator: (startDates) => Array.isArray(startDates) &&
        startDates.length >= 1 && startDates.length <= 3,
      message: 'Tour must have between 1 and 3 start dates.',
    }
  },
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
      day: {
        type: Number,
        validate: {
          validator: function(day) {
            // Check if "this" is the Query object (for updates)
            if (typeof this.parent !== 'function') {
              if (typeof this.getUpdate === 'function') {
                const update = this.getUpdate();
                const duration = update.duration || (update.$set && update.$set.duration);
                if (duration !== undefined) {
                  return day >= 1 && day <= duration;
                }
              }
              return true; // Skip if duration cannot be determined in query context
            }
            // For document validations (save/create)
            const parent = this.parent();
            if (parent && parent.duration) {
              return day >= 1 && day <= parent.duration;
            }
            return true;
          },
          message: 'day must be between 1 and duration',
        }
      },
    }
  ],
  guides: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
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

tourSchema.virtual('available').get(function() {
  if (!this.startDates || this.startDates.length === 0) return false;
  const now = new Date();
  return this.startDates.some(date => !date.soldOut && date.startDate > now);
});

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
  const now = new Date();
  this.startDates.forEach(date => {
    if (date.startDate < now) date.soldOut = true;
  });
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