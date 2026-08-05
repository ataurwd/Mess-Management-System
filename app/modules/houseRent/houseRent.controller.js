const response = require('../../../helper/response');
const HouseRentLib = require('./houseRent.lib');

class HouseRentController {
    static async getRentConfig(req, res) {
        try {
            const { messId } = req.auth;
            const config = await HouseRentLib.getRentConfig(messId);
            return res.status(200).json(response.single(true, 'House rent settings', config));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async updateRentConfig(req, res) {
        try {
            const { messId } = req.auth;
            const { totalRent } = req.body;
            const config = await HouseRentLib.updateRentConfig(messId, Number(totalRent));
            return res.status(200).json(response.single(true, 'House rent updated successfully', config));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async addRentPayment(req, res) {
        try {
            const { messId } = req.auth;
            const payload = { ...req.body, messId };
            const payment = await HouseRentLib.addRentPayment(payload);
            return res.status(201).json(response.single(true, 'Rent payment recorded successfully', payment));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async getRentPayments(req, res) {
        try {
            const { messId } = req.auth;
            const payments = await HouseRentLib.getRentPayments(messId);
            return res.status(200).json(response.single(true, 'Rent payments list', payments));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async deleteRentPayment(req, res) {
        try {
            const { paymentId } = req.params;
            await HouseRentLib.deleteRentPayment(paymentId);
            return res.status(200).json(response.single(true, 'Rent payment deleted successfully', null));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }
}

module.exports = HouseRentController;
