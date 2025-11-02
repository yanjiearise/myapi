const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { processApiRequest } = require('../../lib/orderkuota-logic.js');

const services = [
    { name: 'Info Akun', path: '/get_account_info' },
    { name: 'Riwayat Transaksi', path: '/get_history' },
];

async function handleRequest(req, res, action, requiredParams = []) {
    try {
        for (const param of requiredParams) {
            if (!req.body[param]) {
                return res.status(400).json({ success: false, message: `Parameter '${param}' diperlukan.` });
            }
        }
        const result = await processApiRequest({ action, ...req.body });
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

router.get('/get_account_info/config', (req, res) => res.json({
    inputs: [
        { name: 'username', label: 'Username', type: 'text', required: true },
        { name: 'authToken', label: 'Auth Token', type: 'text', required: true }
    ]
}));
router.post('/get_account_info', protect, (req, res) => handleRequest(req, res, 'get_account_info', ['username', 'authToken']));

router.get('/get_history/config', (req, res) => res.json({
    inputs: [
        { name: 'username', label: 'Username', type: 'text', required: true },
        { name: 'authToken', label: 'Auth Token', type: 'text', required: true }
    ]
}));
router.post('/get_history', protect, (req, res) => handleRequest(req, res, 'get_history', ['username', 'authToken']));

module.exports = { router, services };
