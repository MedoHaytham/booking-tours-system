const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/users')

passport.use(
  new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/api/v1/users/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      // 1) if user signup with google before
      let user = await User.findOne({ googleId: profile.id });
      
      if(user) {
        return cb(null, user);
      }

      // 2) if user signup with email before connect it with googleId
      user = await User.findOne({ email: profile.emails[0].value });
      if(user) {
        user.googleId = profile.id;
        user.emailConfirmed = true;
        await user.save({ validateBeforeSave: false });
        return cb(null, user);
      }

      // 3) if user is totally new
      const newUser = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        photo: profile.photos[0]?.value || 'default.jpg',
        googleId: profile.id,
        emailConfirmed: true,
      });
      return cb(null, newUser);
    } catch (error) {
      return cb(error, null);
    }
  }
));

module.exports = passport;