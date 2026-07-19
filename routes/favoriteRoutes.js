const express = require('express');
const favoriteController = require('../controllers/favoriteController');
const { verifyToken } = require('../middleware/verifyToken');

const router = express.Router();

router.use(verifyToken);

router.route('/')
  .get(favoriteController.myFavorites);

router.route('/:tourId')
  .post(favoriteController.toggleFavorite);

module.exports = router;