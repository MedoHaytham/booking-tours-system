const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/verifyToken');
const { allowedTo } = require('../middleware/allowedTo');
const { USER_ROLES } = require('../utils/usersRoles');


const router = express.Router();

// public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:resetToken', authController.resetPassword);
router.get('/logout', authController.logout);

// protected routes
router.use(verifyToken);

router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe', 
  userController.uploadUserPhoto, 
  userController.resizeUserPhoto, 
  userController.updateMe
);
router.patch('/updateMyPassword', authController.updatePassword);
router.delete('/deleteMe', userController.deleteMe);

// admin only routes
router.use(allowedTo(USER_ROLES.ADMIN));

router.route('/')
  .get(userController.getAllUsers);

router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;