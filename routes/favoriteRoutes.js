const express = require('express');
const favoriteController = require('../controllers/favoriteController');
const { verifyToken } = require('../middleware/verifyToken');
const { allowedTo } = require('../middleware/allowedTo');
const { USER_ROLES } = require('../utils/usersRoles');

const router = express.Router();

router.use(verifyToken);

router.use(allowedTo(USER_ROLES.USER));

router.route('/')
  .get(favoriteController.myFavorites);

router.route('/:tourId')
  .post(favoriteController.toggleFavorite);

module.exports = router;
