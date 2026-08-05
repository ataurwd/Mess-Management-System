const UtilityModel = require('./utility.model');
const UtilityPaymentModel = require('./utilityPayment.model');
const UserModel = require('../user/user.model');

class UtilityLib {
    static async addUtility(payload) {
        return await UtilityModel.create(payload);
    }

    static async getUtilities(messId) {
        return await UtilityModel.find({ messId }).sort({ date: -1 });
    }

    static async deleteUtility(utilityId) {
        return await UtilityModel.findByIdAndDelete(utilityId);
    }

    static async addUtilityPayment(payload) {
        return await UtilityPaymentModel.create(payload);
    }

    static async getUtilityPayments(messId) {
        const payments = await UtilityPaymentModel.find({ messId }).sort({ date: -1 });
        const users = await UserModel.find({ messId });
        const userMap = new Map();
        users.forEach(u => userMap.set(u._id.toString(), u.username));

        return payments.map(p => ({
            ...p._doc,
            username: userMap.get(p.userId.toString()) || 'Member'
        }));
    }

    static async deleteUtilityPayment(paymentId) {
        return await UtilityPaymentModel.findByIdAndDelete(paymentId);
    }
}

module.exports = UtilityLib;
