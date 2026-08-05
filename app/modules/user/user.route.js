const express = require('express');

const router = express.Router();

const authController = require('../auth/auth.controller');

const AuthController = new authController();
const AuthValidation = require('../auth/auth.validation');

const UserController = require('./user.controller');


/**
 * User routing
 */
router.route('/addUser').post(AuthController.isAdmin, AuthValidation.addUserValidation, UserController.addUser);
router.route('/updateUser/:userId')
    .put(AuthController.isAdmin, UserController.updateUser)
    .patch(AuthController.isAdmin, UserController.updateUser);
router.route('/updateUser')
    .put(AuthController.isAdmin, UserController.updateUser)
    .patch(AuthController.isAdmin, UserController.updateUser);
router.route('/changePassword')
    .put(AuthController.isUser, UserController.changePassword)
    .patch(AuthController.isUser, UserController.changePassword);
router.route('/updateProfile')
    .put(AuthController.isUser, UserController.updateProfile)
    .patch(AuthController.isUser, UserController.updateProfile);
router.route('/getProfile').get(AuthController.isUser, UserController.getProfile);
router.route('/getUsers').get(AuthController.isUser, UserController.getUsers);
router.route('/removeUser/:userId').delete(AuthController.isAdmin, UserController.removeUser);

module.exports = router;
