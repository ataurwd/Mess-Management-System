const express = require('express');

const router = express.Router();
const authController = require('../auth/auth.controller');

const AuthController = new authController();
const NoticeController = require('./notice.controller');

router.route('/')
    .get(AuthController.isUser, NoticeController.getNotices)
    .post(AuthController.isAdmin, NoticeController.addNotice);

router.route('/:noticeId')
    .delete(AuthController.isAdmin, NoticeController.deleteNotice);

module.exports = router;
