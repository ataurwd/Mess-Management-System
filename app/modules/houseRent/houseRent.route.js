const express = require('express');

const router = express.Router();
const authController = require('../auth/auth.controller');

const AuthController = new authController();
const HouseRentController = require('./houseRent.controller');

router.route('/config')
    .get(AuthController.isUser, HouseRentController.getRentConfig)
    .post(AuthController.isAdmin, HouseRentController.updateRentConfig)
    .put(AuthController.isAdmin, HouseRentController.updateRentConfig);

router.route('/payments')
    .get(AuthController.isUser, HouseRentController.getRentPayments)
    .post(AuthController.isAdmin, HouseRentController.addRentPayment);

router.route('/payments/:paymentId')
    .delete(AuthController.isAdmin, HouseRentController.deleteRentPayment);

module.exports = router;
