const Tour = require('../models/tours');
const Booking = require('../models/bookings');
const AppError = require('../utils/appError');
const asyncWrapper = require('../utils/asyncWrapper');



exports.getOverview = asyncWrapper(
  async (req, res, next) => {
    // get tour data from db
    const tours = await Tour.find();
    
    res.status(200).render('overview', {
      title: 'All Tours',
      tours
    });
  }
);

exports.getTour = asyncWrapper(
  async(req, res, next) => {
    const { slug } = req.params;
    const tour = await Tour.findOne({slug}).populate({
      path: 'reviews',
      select: 'review rating user '
    });

    if( !tour ) {
      return next( new AppError('Tour Not Found', 404) );
    }

    res.status(200).render('tour', {
      title: `${tour.name} Tour`,
      tour,
    });
  }
);

exports.getLoginForm = asyncWrapper (
  async (req, res, next) => {
    res.status(200).render('login', {
      title: 'Log into your account',
    });
  }
);

exports.getSignupForm = asyncWrapper (
  async (req, res, next) => {
    res.status(200).render('signup', {
      title: 'Sign up',
    });
  }
);

exports.getAccount = asyncWrapper (
  async (req, res, next) => {
    res.status(200).render('account', {
      title: 'Your account',
    });
  }
);

exports.getMyTours = asyncWrapper (
  async (req, res, next) => {
    // 1) find all bookings for this user
    const bookings = await Booking.find({user: req.currentUser._id})

    // We can get tours like this
    // const tours = bookings.map( book => book.tour);
    // but we must populate the tour in the bookings model
    // otherwise 
    // 2) find the tours using the booking ids
    const tourIDs = bookings.map( booking => booking.tour);
    const tours = await Tour.find({_id: {$in: tourIDs }});

    res.status(200).render('overview', {
      title: 'My Tours',
      tours
    });
  }

  // async (req, res, next) => {
  //   const user = await User.findById(req.currentUser._id).populate('bookings');

  //   const tours = user.bookings.map( book => book.tour );

  //   res.status(200).render('overview', {
  //     title: 'My Tours',
  //     tours
  //   });
  // }
);

