const response = require('../../../helper/response');
const BazaarLib = require('./bazaar.lib');

class BazaarController {
    static async addDuty(req, res) {
        try {
            const { messId } = req.auth;
            const payload = { ...req.body, messId };
            const duty = await BazaarLib.addDuty(payload);
            return res.status(201).json(response.single(true, 'Bazaar duty scheduled', duty));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async getDuties(req, res) {
        try {
            const { messId } = req.auth;
            const duties = await BazaarLib.getDuties(messId);
            return res.status(200).json(response.single(true, 'Bazaar duty schedule list', duties));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async updateDutyStatus(req, res) {
        try {
            const { dutyId } = req.params;
            const { isCompleted } = req.body;
            const duty = await BazaarLib.updateDutyStatus(dutyId, isCompleted);
            return res.status(200).json(response.single(true, 'Duty status updated', duty));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }

    static async deleteDuty(req, res) {
        try {
            const { dutyId } = req.params;
            await BazaarLib.deleteDuty(dutyId);
            return res.status(200).json(response.single(true, 'Bazaar duty deleted', null));
        } catch (e) {
            return res.status(500).json(response.error(false, 'An error occur', `${e}`));
        }
    }
}

module.exports = BazaarController;
