const response = require('../../../helper/response');
const UtilityLib = require('./utility.lib');

class UtilityController {
    static async addUtility(req, res) {
        try {
            const { messId } = req.auth;
            const payload = { ...req.body, messId };
            const utility = await UtilityLib.addUtility(payload);
            return res.status(201).json(response.single(true, 'Utility bill recorded', utility));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async getUtilities(req, res) {
        try {
            const { messId } = req.auth;
            const utilities = await UtilityLib.getUtilities(messId);
            return res.status(200).json(response.single(true, 'Utilities list', utilities));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async deleteUtility(req, res) {
        try {
            const { utilityId } = req.params;
            await UtilityLib.deleteUtility(utilityId);
            return res.status(200).json(response.single(true, 'Utility bill deleted', null));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async addUtilityPayment(req, res) {
        try {
            const { messId } = req.auth;
            const payload = { ...req.body, messId };
            const payment = await UtilityLib.addUtilityPayment(payload);
            return res.status(201).json(response.single(true, 'Utility payment recorded', payment));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async getUtilityPayments(req, res) {
        try {
            const { messId } = req.auth;
            const payments = await UtilityLib.getUtilityPayments(messId);
            return res.status(200).json(response.single(true, 'Utility payments list', payments));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async deleteUtilityPayment(req, res) {
        try {
            const { paymentId } = req.params;
            await UtilityLib.deleteUtilityPayment(paymentId);
            return res.status(200).json(response.single(true, 'Utility payment deleted', null));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }
}

module.exports = UtilityController;
