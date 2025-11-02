const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: ['API_KEY_PRICE', 'API_KEY_DURATION_DAYS']
    },
    value: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Setting', SettingSchema);
