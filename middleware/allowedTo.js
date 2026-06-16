/* eslint-disable arrow-body-style */
const AppError = require("../utils/appError")

const allowedTo = (...roles) => {
  return (req, res, next ) => {
    if(!req.currentUser) {
      return next(new AppError('Unauthenticated', 401)); 
    }
    if(!roles.includes(req.currentUser.role)) {
      return next(new AppError('You are not allowed to access this resource', 403)); 
    }
    next();
  }
};

module.exports = { allowedTo };