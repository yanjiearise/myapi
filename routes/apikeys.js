const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const Setting = require('../models/Setting');
const router = express.Router();

async function getSetting(key, defaultValue) {
    try {
        const setting = await Setting.findOne({ key });
        return setting ? setting.value : defaultValue;
    } catch (error) {
        return defaultValue;
    }
}

router.use((req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Silakan login terlebih dahulu.' });
    }
    next();
});

router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).select('apiKeys');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        }
        res.json({ success: true, apiKeys: user.apiKeys });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Nama API Key diperlukan.' });
        }

        const user = await User.findById(req.session.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        }

        const priceString = await getSetting('API_KEY_PRICE', '50000');
        const price = parseInt(priceString, 10);
        
        if (user.balance < price) {
            return res.status(402).json({ success: false, message: 'Saldo tidak mencukupi.' });
        }
        
        user.balance -= price;

        const newKey = `sk-${crypto.randomBytes(24).toString('hex')}`;
        const durationString = await getSetting('API_KEY_DURATION_DAYS', '30');
        const durationDays = parseInt(durationString, 10);
        
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        user.apiKeys.push({ key: newKey, name, expiresAt });
        await user.save();

        res.status(201).json({ success: true, apiKey: newKey, message: 'API Key berhasil dibuat.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal membuat API Key.' });
    }
});

router.delete('/:keyId', async (req, res) => {
    try {
        const { keyId } = req.params;
        await User.updateOne(
            { _id: req.session.user.id },
            { $pull: { apiKeys: { _id: keyId } } }
        );
        res.json({ success: true, message: 'API Key berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghapus API Key.' });
    }
});

module.exports = { router, services: [] };
