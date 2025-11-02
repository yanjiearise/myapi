const express = require('express');
const Setting = require('../models/Setting');
const router = express.Router();

const getSettings = async (res) => {
    try {
        const settings = await Setting.find({});
        const settingsMap = settings.reduce((map, item) => {
            map[item.key] = item.value;
            return map;
        }, {});

        const price = settingsMap.API_KEY_PRICE || '50000';
        const duration = settingsMap.API_KEY_DURATION_DAYS || '30';

        return { success: true, price: parseInt(price, 10), duration: parseInt(duration, 10) };
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

router.get('/settings', async (req, res) => {
    const settingsData = await getSettings(res);
    if (settingsData) {
        res.json(settingsData);
    }
});

module.exports = { router, getSettings };
