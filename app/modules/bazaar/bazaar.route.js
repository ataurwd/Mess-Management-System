const express = require('express');

const router = express.Router();
const authController = require('../auth/auth.controller');

const AuthController = new authController();
const BazaarController = require('./bazaar.controller');

router.route('/')
    .get(AuthController.isUser, BazaarController.getDuties)
    .post(AuthController.isAdmin, BazaarController.addDuty);

router.route('/:dutyId')
    .put(AuthController.isUser, BazaarController.updateDutyStatus)
    .patch(AuthController.isUser, BazaarController.updateDutyStatus)
    .delete(AuthController.isAdmin, BazaarController.deleteDuty);

module.exports = router;
