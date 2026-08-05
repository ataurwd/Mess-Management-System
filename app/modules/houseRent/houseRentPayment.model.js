const mongoose = require('mongoose');
const schema = mongoose.Schema;

const houseRentPaymentSchema = new schema({
    messId: {
        type: schema.ObjectId,
        required: true,
    },
    userId: {
        type: schema.ObjectId,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    month: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    paymentMethod: {
        type: String,
        default: 'Cash',
    },
    note: {
        type: String,
        default: '',
    },
}, { versionKey: false });

module.exports = mongoose.model('houseRentPayment', houseRentPaymentSchema);
