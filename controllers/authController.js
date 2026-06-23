const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const AppError = require('../utils/appError');
const asyncWrapper = require('../utils/asyncWrapper');
const Email = require('../utils/email');
const httpStatus = require('../utils/httpStatusText');

const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN
});

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  res.cookie('jwt', token, {
    expires: new Date( 
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });

  // remove the password from response
  user.password = undefined;
    
  res.status(statusCode).json({
    status: httpStatus.SUCCESS,
    token,
    data: {
      user
    }
  });
}

exports.signup = asyncWrapper(
  async (req, res, next) => {
    // 1) create new user
    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm
    });

    // 2) send welcome email
    const url = `${req.protocol}://${req.get('host')}/me`;
    new Email(newUser, url).sendWelcome().catch((err) => {
      console.log('SendGrid Error:', err.message);
      console.log('full error:', err);
      console.error('full error with console error', err);
    });
    
    createSendToken(newUser, 201, req, res);
  }
);

exports.login = asyncWrapper ( 
  async (req, res, next) => {
    const {email, password} = req.body;

    // check if email and password exist
    if( !email || !password ) {
      return next(new AppError('please enter email and password', 400));
    };

    // check if user exists with this email
    const user = await User.findOne({ email }).select('+password');

    if( !user ) {
      return next(new AppError('Invalid email or password', 401));
    };
    
    // check if the password is correct
    const correct = await user.correctPassword(password, user.password);

    if( !correct ) {
      return next(new AppError('Invalid email or password', 401));
    };

    // if everything is ok, creat token and send it
    createSendToken(user, 200, req, res);
  }
);

exports.forgotPassword = asyncWrapper(
  async (req, res, next) => {
    // 1) Get user based on POSTed email
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return next(new AppError('there is no user with this email address', 404));
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    try {
      const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

      await new Email(user, resetUrl).sendResetPassword();

      res.status(200).json({
        status: httpStatus.SUCCESS,
        message: 'Token sent to email!',
      });
    }catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new AppError('There was an error sending the email!. Try again later.', 500));
    }
  }
);

exports.resetPassword = asyncWrapper(
  async (req, res, next) => {
    // 1) Get user based on token
    const { resetToken } = req.params;
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const user = await User.findOne({ 
      passwordResetToken: hashedToken,
      passwordResetExpires : { $gt: Date.now() }
    });

    // 2) if token not expired and user found, set the new password and update changedPasswordAt
    if (!user) {
      return next(new AppError('Token is invalid or has expired Token!', 400));
    }

    const { newPassword, confirmNewPassword } = req.body;

    user.password = newPassword;
    user.passwordConfirm = confirmNewPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    // 3) log user in and send JWT
    createSendToken(user, 200, req, res);
  }
);

exports.updatePassword = asyncWrapper(
  async (req, res, next) => {
    // 1) Get user from collection
    const { _id } = req.currentUser;
    const user = await User.findById(_id).select('+password');

    // 2) check if POSTed current password is correct
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return next(new AppError('Please provide all the required fields', 400));
    }

    // check if the current password is correct
    const correct = await user.correctPassword(currentPassword, user.password);
    if ( !correct ) {
      return next(new AppError('Your current password is wrong', 401));
    }

    // 3) if so, then update the password
    user.password = newPassword;
    user.passwordConfirm = confirmNewPassword;
    await user.save();

    // 4) log user in, send JWT
    createSendToken(user, 200, req, res);
  }
);

exports.logout = asyncWrapper (
  async (req, res, next) => {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(
        Date.now() + 10 * 1000
      )
    });

    res.status(200).json({
      status: httpStatus.SUCCESS
    })
  }
);