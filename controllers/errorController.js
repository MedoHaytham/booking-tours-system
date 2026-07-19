/* eslint-disable no-console */
/* eslint-disable node/no-unsupported-features/es-syntax */
const httpStatusText = require('../utils/httpStatusText');
const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateKeysDB = err => {
  const keys = Object.keys(err.keyValue);

  // Compound key duplicate (e.g. review: tour + user)
  if (keys.includes('tour') && keys.includes('user')) {
    return new AppError('You have already reviewed this tour.', 400);
  }

  // Single field duplicate (e.g. email)
  const message = `The ${keys.join(', ')} "${Object.values(err.keyValue).join(', ')}" already exists.`;
  return new AppError(message, 400);
};

const handleValidationError = err => {
  const messages = Object.values(err.errors).map( error => error.message );
  const message = `Invalid input data. ${messages.join(' && ')}.`;
  return new AppError(message, 400);
};

const handleJWTError = err => {
  const message = `Invalid or expired Token. ${err.message}`;
  return new AppError(message, 401);
};

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }

  // B) Render Website
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Someting went wrong',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // B) Programming error or other unknown error don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(500).json({
      status: httpStatusText.ERROR,
      message: 'Something went wrong',
    });
  }

  // B) Render Website
  // A) Operational, trusted error send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Someting went wrong',
      msg: err.message
    });
  }
  // B) Programming error or other unknown error don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);
  // 2) Send generic message
  return res.status(500).render('error', {
    title: 'Someting went wrong',
    msg: 'Please try again later',
  });
};


module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || httpStatusText.ERROR;
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err, name: err.name, message: err.message };
    // let error = { ...err }
    // error.message = err.message
    
    // Handle known DB errors
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateKeysDB(error);
    if (error.name === 'ValidationError') error = handleValidationError(error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') error = handleJWTError(error);
    
    // production errors
    sendErrorProd(error, req, res);
  }
};