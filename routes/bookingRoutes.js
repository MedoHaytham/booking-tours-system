const express = require('express');
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/verifyToken');
const { allowedTo } = require('../middleware/allowedTo');
const { USER_ROLES } = require('../utils/usersRoles');

const router = express.Router();

router.use(verifyToken);

router.get('/checkout-session/:tourId/:dateId', bookingController.getCheckoutSession);
router.get('/my-tours', bookingController.getMyTours);

router.use(allowedTo(USER_ROLES.ADMIN));

router.route('/')
  .get(bookingController.getAllBookings);

router.route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;