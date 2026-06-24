const express = require('express');
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/verifyToken');
const { allowedTo } = require('../middleware/allowedTo');
const {USER_ROLES} = require('../utils/usersRoles');

const router = express.Router({ mergeParams: true });



router.use(verifyToken);

router.get('/my-reviews', reviewController.getMyReviews);

router.route('/')
  .get(reviewController.getAllReviews)
  .post(allowedTo(USER_ROLES.USER), reviewController.setTourAndUserIds, reviewController.createReview);

router.route('/:id')
  .get(reviewController.getReview)
  .patch(allowedTo(USER_ROLES.ADMIN, USER_ROLES.USER), reviewController.updateReview)
  .delete(allowedTo(USER_ROLES.ADMIN, USER_ROLES.USER), reviewController.deleteReview);

module.exports = router;