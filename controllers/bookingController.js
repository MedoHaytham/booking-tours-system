const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const asyncWrapper = require('../utils/asyncWrapper');
const Booking = require('../models/bookings');
const Tour = require('../models/tours');
const User = require('../models/users');
const httpStatus = require('../utils/httpStatusText');
const factory = require('./handlerFactory');

exports.getAllBookings = factory.getAll(Booking);
exports.getBooking = factory.getOne(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);


exports.getMyTours = asyncWrapper(
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

    res.status(200).json({
      status: httpStatus.SUCCESS,
      data: {
        data: tours
      }
    });
  }
);

exports.getCheckoutSession = asyncWrapper(
  async(req, res, next) => {
    // 1) Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/my-tours`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.currentUser.email,
      client_reference_id: req.params.tourId,
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
  const tourId = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const tour = await Tour.findById(tourId);
  const { price } = tour

  await Booking.create({ tour: tourId, user, price});
};

exports.webhookCheckout = async (req, res, next) => {
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
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};