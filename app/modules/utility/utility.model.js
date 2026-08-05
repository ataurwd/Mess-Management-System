const mongoose = require('mongoose');
const schema = mongoose.Schema;

const utilitySchema = new schema({
    messId: { type: schema.ObjectId, required: true },
    title: { type: String, required: true }, // e.g. "Electricity Bill", "Gas Bill", "Wi-Fi", "Maid Salary", "Water"
    amount: { type: Number, required: true },
    month: { type: String, required: true },
    date: { type: Date, default: Date.now },
}, { versionKey: false });

module.exports = mongoose.model('utility', utilitySchema);
