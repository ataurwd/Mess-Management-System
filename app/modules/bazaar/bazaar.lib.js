const BazaarModel = require('./bazaar.model');
const UserModel = require('../user/user.model');

class BazaarLib {
    static async addDuty(payload) {
        return await BazaarModel.create(payload);
    }

    static async getDuties(messId) {
        const duties = await BazaarModel.find({ messId }).sort({ date: 1 });
        const users = await UserModel.find({ messId });
        const userMap = new Map();
        users.forEach(u => userMap.set(u._id.toString(), u.username));

        return duties.map(d => ({
            ...d._doc,
            username: userMap.get(d.userId.toString()) || 'Member'
        }));
    }

    static async updateDutyStatus(dutyId, isCompleted) {
        return await BazaarModel.findByIdAndUpdate(dutyId, { $set: { isCompleted } }, { new: true });
    }

    static async deleteDuty(dutyId) {
        return await BazaarModel.findByIdAndDelete(dutyId);
    }
}

module.exports = BazaarLib;
