const express = require('express');
const { getSettings } = require('./public');
const router = express.Router();

router.get('/apikey', async (req, res) => {
    const settingsData = await getSettings(res);
    if (settingsData) {
        res.json(settingsData);
    }
});

module.exports = { router };
