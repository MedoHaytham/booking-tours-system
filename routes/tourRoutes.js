const express = require('express');
const tourController = require('../controllers/tourController');
const reviewsRouter = require('./reviewRoutes');

const { verifyToken } = require('../middleware/verifyToken');
const { allowedTo } = require('../middleware/allowedTo');
const { USER_ROLES } = require('../utils/usersRoles');

const router = express.Router();

router.use('/:tourId/reviews', reviewsRouter);

router.route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats')
  .get(tourController.getTourStats);

router.route('/monthly-plan/:year')
  .get(
    verifyToken, 
    allowedTo(USER_ROLES.ADMIN, USER_ROLES.LEAD_GUIDE, USER_ROLES.GUIDE), 
    tourController.getMonthlyPlan
  );

router.route('/tour-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin)

router.route('/distances/:latlng/unit/:unit')
  .get(tourController.getDistances)

router.route('/')
  .get(tourController.getAllTours)
  .post(
    verifyToken, 
    allowedTo(USER_ROLES.ADMIN, USER_ROLES.LEAD_GUIDE), 
    tourController.createTour
  );

router.route('/:id')
  .get(tourController.getTour)
  .patch(
    verifyToken, 
    allowedTo(USER_ROLES.ADMIN, USER_ROLES.LEAD_GUIDE), 
    tourController.uploadTourImages, 
    tourController.resizeTourImages, 
    tourController.updateTour
  )
  .delete(
    verifyToken, 
    allowedTo(USER_ROLES.ADMIN, USER_ROLES.LEAD_GUIDE), 
    tourController.deleteTour
  );

router.route('/slug/:slug')
  .get(tourController.getTourBySlug);

module.exports = router;