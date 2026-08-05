const mongoose = require('mongoose');
const schema = mongoose.Schema;

const bazaarSchema = new schema({
    messId: { type: schema.ObjectId, required: true },
    userId: { type: schema.ObjectId, required: true },
    date: { type: Date, required: true },
    assignedBy: { type: String, default: 'Manager' },
    note: { type: String, default: '' },
    isCompleted: { type: Boolean, default: false },
}, { versionKey: false });

module.exports = mongoose.model('bazaarDuty', bazaarSchema);
