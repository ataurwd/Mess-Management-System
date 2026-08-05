const mongoose = require('mongoose');

const schema = mongoose.Schema;


const expenseSchema = new schema({
    amount: {
        type: Number,
        defaultValue: 0,
        required: true,
    },
    date: {
        type: Date,
        defaultValue: new Date().toLocaleDateString(),
        required: true,
    },
    summary: {
        type: String,
        required: false,
    },
    categoryId: {
        type: schema.ObjectId,
        required: false,
    },
    userId: {
        type: schema.ObjectId,
        required: true,
    },
    messId: {
        type: schema.ObjectId,
        required: true,
    },
}, { versionKey: false });


module.exports = mongoose.model('expense', expenseSchema);
