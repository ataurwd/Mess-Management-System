const HouseRentConfigModel = require('./houseRentConfig.model');
const HouseRentPaymentModel = require('./houseRentPayment.model');
const UserModel = require('../user/user.model');

class HouseRentLib {
    static async getRentConfig(messId) {
        let config = await HouseRentConfigModel.findOne({ messId });
        if (!config) {
            config = await HouseRentConfigModel.create({ messId, totalRent: 16500 });
        }
        return config;
    }

    static async updateRentConfig(messId, totalRent) {
        const config = await HouseRentConfigModel.findOneAndUpdate(
            { messId },
            { $set: { totalRent } },
            { new: true, upsert: true }
        );
        return config;
    }

    static async addRentPayment(payload) {
        return await HouseRentPaymentModel.create(payload);
    }

    static async getRentPayments(messId) {
        const payments = await HouseRentPaymentModel.find({ messId }).sort({ date: -1 });
        const users = await UserModel.find({ messId });
        const userMap = new Map();
        users.forEach((u) => userMap.set(u._id.toString(), u.username));

        return payments.map((p) => ({
            ...p._doc,
            username: userMap.get(p.userId.toString()) || 'Member',
        }));
    }

    static async deleteRentPayment(paymentId) {
        return await HouseRentPaymentModel.findByIdAndDelete(paymentId);
    }
}

module.exports = HouseRentLib;
