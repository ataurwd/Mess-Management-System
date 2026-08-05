const response = require('../../../helper/response');
const NoticeLib = require('./notice.lib');

class NoticeController {
    static async addNotice(req, res) {
        try {
            const { messId, username } = req.auth;
            const payload = { ...req.body, messId, postedBy: username || 'Manager' };
            const notice = await NoticeLib.addNotice(payload);
            return res.status(201).json(response.single(true, 'Notice posted successfully', notice));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async getNotices(req, res) {
        try {
            const { messId } = req.auth;
            const notices = await NoticeLib.getNotices(messId);
            return res.status(200).json(response.single(true, 'Notices list', notices));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async deleteNotice(req, res) {
        try {
            const { noticeId } = req.params;
            await NoticeLib.deleteNotice(noticeId);
            return res.status(200).json(response.single(true, 'Notice deleted', null));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }
}

module.exports = NoticeController;
