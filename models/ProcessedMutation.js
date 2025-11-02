const mongoose = require('mongoose');

const ProcessedMutationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mutationIdentifier: {
        type: String,
        required: true,
    }
}, {
    timestamps: { createdAt: 'processedAt' }
});

ProcessedMutationSchema.index({ userId: 1, mutationIdentifier: 1 }, { unique: true });

module.exports = mongoose.model('ProcessedMutation', ProcessedMutationSchema);
