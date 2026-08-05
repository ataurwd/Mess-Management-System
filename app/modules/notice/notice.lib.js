const NoticeModel = require('./notice.model');

class NoticeLib {
    static async addNotice(payload) {
        return await NoticeModel.create(payload);
    }

    static async getNotices(messId) {
        return await NoticeModel.find({ messId }).sort({ isPinned: -1, date: -1 });
    }

    static async deleteNotice(noticeId) {
        return await NoticeModel.findByIdAndDelete(noticeId);
    }
}

module.exports = NoticeLib;
