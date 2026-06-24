const express = require('express');
const bookingController = require('../controllers/bookingController');

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(bookingController.getAllBookings)

module.exports = router;