const jwt = require('jsonwebtoken')
const { promisify } = require('util');
const User = require('../models/users');

exports.isLoggedIn = async (req, res, next) => {
  if(req.cookies.jwt) {
    try {
      // 1) verify token
      const token = req.cookies.jwt;

      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

      // 2) check if user still exists 
      const currentUser = await User.findById(decoded.id);
      if( !currentUser ) {
        return next();
      };

      // 3) check if user changed his password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      };

      // There is a logged in user
      res.locals.user = currentUser;
      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};

