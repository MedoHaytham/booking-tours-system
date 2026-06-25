const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const asyncWrapper = require('../utils/asyncWrapper');
const Booking = require('../models/bookings');
const Tour = require('../models/tours');
const User = require('../models/users');
const httpStatus = require('../utils/httpStatusText');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);


exports.getMyTours = asyncWrapper(
  async (req, res, next) => {
    // 1) find all bookings for this user
    const bookings = await Booking.find({ user: req.currentUser._id });

    // 2) find the tours using the booking ids
    const tourIDs = bookings.map(booking => booking.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    // 3) also return the booked dates so the frontend can check per-date
    const bookedDates = bookings.map(b => ({
      tourId: (b.tour._id ?? b.tour).toString(),
      date: b.date,
    }));

    res.status(200).json({
      status: httpStatus.SUCCESS,
      length: tours.length,
      data: { tours, bookedDates }
    });
  }
);

exports.getCheckoutSession = asyncWrapper(
  async(req, res, next) => {

    const { tourId, dateId } = req.params;
    // 1) Get the currently booked tour and the booked date
    const tour = await Tour.findById(tourId);
    const bookedDate = tour.startDates.id(dateId);

    if (!bookedDate){
      return next(new AppError('Date not found', 404));
    }

    // 2) Check if the tour sold out and current date
    if (bookedDate.startDate <= new Date()) {
      return next(new AppError('This tour date has already passed', 400));
    }

    if (bookedDate.soldOut){
      return next(new AppError('This tour is sold out', 400));
    }

    // 3) Check if user has already booked this tour
    const existingBooking = await Booking.findOne({
      tour: tourId,
      user: req.currentUser._id,
      date: bookedDate.startDate,
      paid: true
    });

    if (existingBooking){
      return next(new AppError('You have already booked this tour', 400));
    }

    // 4) Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/my-tours`,
      cancel_url: `${process.env.FRONTEND_URL}/tour/${tour.slug}`,
      customer_email: req.currentUser.email,
      client_reference_id: req.params.tourId,
      metadata: { dateId },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: tour.price * 100,
            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [tour.imageCover]
            },
          },
          quantity: 1
        }
        // Jonas way ( older ):
        // {
        //   name: `${tour.name} Tour`,
        //   description: tour.summary,
        //   images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        //   amount: tour.price * 100,
        //   currency: 'usd',
        //   quantity: 1
        // }
      ]
    });

    // 3) Create session as response
    res.status(200).json({
      status: httpStatus.SUCCESS,
      session
    });
  }
);

// exports.createBookingCheckout = asyncWrapper(
//   async (req, res, next) => {
//     // this is a temporary solution, because it's UNSECURE: everyone can make bookings without paying
//     const { tour, user, price } = req.query;
    
//     if( !tour && !user && !price ) return next();
//     await Booking.create({tour, user, price});

//     res.redirect(req.originalUrl.split('?')[0]);
//   }
// );

const createBookingCheckout = async session => {
  const exists = await Booking.findOne({ sessionId: session.id });
  if(exists) return ;
  
  const tourId = session.client_reference_id;
  const { dateId } = session.metadata;

  const userDoc = await User.findOne({ email: session.customer_email });
  if (!userDoc) return;

  const tour = await Tour.findById(tourId);
  const bookedDate = tour.startDates.id(dateId);
  if (!bookedDate) return;

  // increase the participants and update the soldOut field if participants reach the maxGroupSize
  bookedDate.participants += 1;
  if (bookedDate.participants >= tour.maxGroupSize) bookedDate.soldOut = true;
  await tour.save();
  
  await Booking.create({ 
    tour: tourId, 
    user: userDoc._id,
    date: bookedDate.startDate,
    price: tour.price, 
    sessionId: session.id
  });
};

exports.webhookCheckout = asyncWrapper(
  async (req, res, next) => {
    const signature = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    }catch (err) {
      return res.status(400).send(`Webhook error: ${err}`)
    }

    if (event.type === 'checkout.session.completed')
      await createBookingCheckout(event.data.object);

    res.status(200).json({ received: true });
  }
);