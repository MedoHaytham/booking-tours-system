const express = require('express');
const viewController = require('../controllers/viewController');
const { isLoggedIn } = require('../middleware/isLoggedIn');
const { verifyToken } = require('../middleware/verifyToken');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.get('/', 
  bookingController.createBookingCheckout,
  isLoggedIn, 
  viewController.getOverview
);

router.get('/tour/:slug', isLoggedIn, viewController.getTour);
router.get('/login', isLoggedIn, viewController.getLoginForm);
router.get('/signup', isLoggedIn, viewController.getSignupForm);
router.get('/me', verifyToken, viewController.getAccount);
router.get('/my-tours', verifyToken, viewController.getMyTours);


module.exports = router;
