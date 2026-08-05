const mongoose = require('mongoose');
const schema = mongoose.Schema;

const houseRentConfigSchema = new schema({
    messId: {
        type: schema.ObjectId,
        required: true,
    },
    totalRent: {
        type: Number,
        default: 16500,
        required: true,
    },
}, { versionKey: false });

module.exports = mongoose.model('houseRentConfig', houseRentConfigSchema);
