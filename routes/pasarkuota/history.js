const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { PasarKuotaHistory } = require('../../lib/pasarkuota-history-logic.js');

const services = [
    {
        name: 'Transaction History',
        path: '/get_history'
    }
];

router.get('/get_history/config', (req, res) => {
    res.json({
        inputs: [
            { name: 'authToken', label: 'Auth Token', type: 'text', required: true },
            { name: 'authUsername', label: 'Auth Username', type: 'text', required: true },
            { name: 'status', label: 'Status (ok, pending, error)', type: 'text', required: false, defaultValue: 'ok' },
            { name: 'page', label: 'Page', type: 'number', required: false, defaultValue: 1 }
        ]
    });
});

router.post('/get_history', protect, async (req, res) => {
    try {
        const { authToken, authUsername, status, page } = req.body;
        if (!authToken || !authUsername) {
            return res.status(400).json({ success: false, message: 'Auth Token and Auth Username are required.' });
        }
        
        const client = new PasarKuotaHistory();
        const result = await client.getHistory(authToken, authUsername, status, page);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = { router, services };
