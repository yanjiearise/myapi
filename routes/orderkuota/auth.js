const express = require('express');
const router = express.Router();
const { processApiRequest } = require('../../lib/orderkuota-logic.js');

const services = [
    { name: 'Get Token (Langkah 1: Request OTP)', path: '/request_otp' },
    { name: 'Get Token (Langkah 2: Verify OTP)', path: '/verify_otp' },
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

router.get('/request_otp/config', (req, res) => res.json({ inputs: [ { name: 'username', label: 'Username', type: 'text', required: true }, { name: 'password', label: 'Password', type: 'password', required: true } ] }));
router.post('/request_otp', (req, res) => handleRequest(req, res, 'request_otp', ['username', 'password']));

router.get('/verify_otp/config', (req, res) => res.json({ inputs: [ { name: 'username', label: 'Username', type: 'text', required: true }, { name: 'otp', label: 'Kode OTP', type: 'text', required: true } ] }));
router.post('/verify_otp', (req, res) => handleRequest(req, res, 'verify_otp', ['username', 'otp']));

module.exports = { router, services };
