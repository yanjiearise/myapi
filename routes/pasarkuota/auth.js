const express = require('express');
const router = express.Router();
const { PasarKuota } = require('../../lib/pasarkuota-gettoken-logic.js');

const services = [
    { name: 'Get Token (Step 1: Request OTP)', path: '/request_otp' },
    { name: 'Get Token (Step 2: Verify OTP)', path: '/verify_otp' },
];

router.get('/request_otp/config', (req, res) => {
    res.json({
        inputs: [
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'password', label: 'Password', type: 'password', required: true }
        ]
    });
});

router.post('/request_otp', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }
        const client = new PasarKuota();
        const result = await client.requestOtp(username, password);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/verify_otp/config', (req, res) => {
    res.json({
        inputs: [
            { name: 'username', label: 'Username', type: 'text', required: true },
            { name: 'otpCode', label: 'OTP Code', type: 'text', required: true }
        ]
    });
});

router.post('/verify_otp', async (req, res) => {
    try {
        const { username, otpCode } = req.body;
        if (!username || !otpCode) {
            return res.status(400).json({ success: false, message: 'Username and OTP code are required.' });
        }
        const client = new PasarKuota();
        const result = await client.verifyOtp(username, otpCode);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = { router, services };
