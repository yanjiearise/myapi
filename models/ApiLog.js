const mongoose = require('mongoose');

const ApiLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    apiKey: {
        type: String,
        required: true
    },
    endpoint: {
        type: String,
        required: true
    },
    method: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    statusCode: {
        type: Number,
        required: true
    },
    success: {
        type: Boolean,
        required: true
    }
}, {
    timestamps: { createdAt: 'timestamp' }
});

module.exports = mongoose.model('ApiLog', ApiLogSchema);
