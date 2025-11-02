const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    uniqueAmount: {
        type: Number,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'expired'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        default: () => Date.now() + 2 * 60 * 1000
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Transaction', TransactionSchema);
