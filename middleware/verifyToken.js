const jwt = require('jsonwebtoken')
const { promisify } = require('util');
const asyncWrapper = require('../utils/asyncWrapper');
const AppError = require('../utils/appError');
const User = require('../models/users');

exports.verifyToken = asyncWrapper( 
  async (req, res, next) => {
    // 1) check if authHeader exist and start with Bearer and 
    // get token from it or get token from cookie
    const authHeader = req.headers.authorization;

    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }    
  
    if ( !token ) {
      return next( new AppError('You are not logged in! Please log in to get access', 401) );
    };

    // 2) verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) check if user is not exist 
    const currentUser = await User.findById(decoded.id);
    if( !currentUser ) {
      return next(new AppError('The user that belong to this token does not exist', 401));
    };

    // 4) check if user changed his password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('User changed his password, please login again', 401));
    };

    req.currentUser = currentUser;
    res.locals.user = currentUser;
    next();
  }
);

