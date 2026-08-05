const express = require('express');
const router = express.Router();
const authController = require('../auth/auth.controller');
const AuthController = new authController();
const UtilityController = require('./utility.controller');

router.route('/bills')
    .get(AuthController.isUser, UtilityController.getUtilities)
    .post(AuthController.isAdmin, UtilityController.addUtility);

router.route('/bills/:utilityId')
    .put(AuthController.isAdmin, UtilityController.updateUtility)
    .delete(AuthController.isAdmin, UtilityController.deleteUtility);

router.route('/payments')
    .get(AuthController.isUser, UtilityController.getUtilityPayments)
    .post(AuthController.isAdmin, UtilityController.addUtilityPayment);

router.route('/payments/:paymentId')
    .delete(AuthController.isAdmin, UtilityController.deleteUtilityPayment);

module.exports = router;
