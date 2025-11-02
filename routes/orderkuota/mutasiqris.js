const express = require('express');
const { OrkutQrisMutasi } = require('../../lib/orkut-qrmutasi-new.js');
const router = express.Router();
const { flexibleProtect } = require('../../middleware/flexibleProtect');

const services = [
    {
        name: 'Mutasi QRIS',
        path: '/mutasiqris',
        method: 'POST'
    }
];

router.get('/mutasiqris/config', (req, res) => {
    res.json({
        inputs: [
            { name: 'authToken', label: 'Auth Token', type: 'text', required: true },
            { name: 'authUsername', label: 'Auth Username', type: 'text', required: true },
            { name: 'page', label: 'Halaman', type: 'number', required: false, defaultValue: 1 }
        ]
    });
});

router.post('/mutasiqris', flexibleProtect, async (req, res) => {
    const { authToken, authUsername, page } = req.body;
    if (!authToken || !authUsername) {
        return res.status(400).json({ success: false, message: 'Kredensial tidak lengkap.' });
    }
    try {
        const orkut = new OrkutQrisMutasi();
        const history = await orkut.getHistory(authToken, authUsername, { page });
        res.json(history);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = { router, services };
