const mongoose = require('mongoose');
const schema = mongoose.Schema;

const utilityPaymentSchema = new schema({
    messId: { type: schema.ObjectId, required: true },
    userId: { type: schema.ObjectId, required: true },
    utilityId: { type: schema.ObjectId, required: false },
    amount: { type: Number, required: true },
    month: { type: String, required: true },
    date: { type: Date, default: Date.now },
    paymentMethod: { type: String, default: 'Cash' },
    note: { type: String, default: '' },
}, { versionKey: false });

module.exports = mongoose.model('utilityPayment', utilityPaymentSchema);
