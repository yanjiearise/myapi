const mongoose = require('mongoose');

const ApiKeySchema = new mongoose.Schema({
    key: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
});

const SecuritySchema = new mongoose.Schema({
    whitelist: [{ type: String, trim: true }],
    internalWhitelist: [{ type: String, trim: true }]
}, { _id: false });

const CallbackSettingsSchema = new mongoose.Schema({
    mutasiAuthToken: { type: String },
    mutasiAuthUsername: { type: String },
    qrisImagePath: { type: String },
    isActive: { type: Boolean, default: false },
    webhookUrl: { type: String }
}, { _id: false });

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 0 },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCode: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    apiKeys: [ApiKeySchema],
    security: {
        type: SecuritySchema,
        default: () => ({ whitelist: [], internalWhitelist: [] })
    },
    callbackSettings: {
        type: CallbackSettingsSchema,
        default: () => ({})
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
