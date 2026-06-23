const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorControler');

const toursRouter = require('./routes/tourRoutes');
const usersRouter = require('./routes/userRoutes');
const reviewsRouter = require('./routes/reviewRoutes');
const bookingsRouter = require('./routes/bookingRoutes');
const bookingController = require('./controllers/bookingController');
const viewsRouter = require('./routes/viewRoutes');

const app = express();

app.set('trust proxy', 1);

// setting up pug engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Enable CORS for all routes
app.use(cors());
app.options('*', cors());

// serving static files
app.use(express.static(path.join(__dirname, 'public')));

// set security headers
// app.use(helmet());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://api.mapbox.com", "https://js.stripe.com"],
        workerSrc: ["'self'", "blob:"],
        childSrc: ["'self'", "blob:", "https://js.stripe.com"],
        frameSrc: ["'self'", "https://js.stripe.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://api.mapbox.com", "https://*.mapbox.com", "https://res.cloudinary.com"],
        connectSrc: [
          "'self'",
          "https://api.mapbox.com",
          "https://*.mapbox.com",
          "https://events.mapbox.com",
          "ws://localhost:*",
          "data:",
          "https://*.stripe.com"
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://api.mapbox.com", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"]
      }
    }
  })
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// booking checkout webhook ( this must come before all other routes ) ( /raw not json ) ( because it will be sent from stripe )
app.post('/webhook-checkout', 
  express.raw({type: 'application/json'}), 
  bookingController.webhookCheckout
);

// Body parser (reading data from body into req.body)
app.use(express.json({ limit: '10kb' }));

// Cookie parser
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'maxGroupSize', 'difficulty', 'price']
}));

// Compression
app.use(compression());

// 2) ROUTES
app.use('/', viewsRouter);
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/bookings', bookingsRouter);

// 3) Handling unhandled routes (404)
app.all('*', (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
});

// 4) Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;