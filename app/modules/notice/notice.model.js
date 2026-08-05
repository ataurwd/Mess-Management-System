const mongoose = require('mongoose');
const schema = mongoose.Schema;

const noticeSchema = new schema({
    messId: { type: schema.ObjectId, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    postedBy: { type: String, default: 'Manager' },
    date: { type: Date, default: Date.now },
    isPinned: { type: Boolean, default: true },
}, { versionKey: false });

module.exports = mongoose.model('notice', noticeSchema);
