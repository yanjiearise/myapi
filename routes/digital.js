const express = require('express');
const { OrderKuotaDigital } = require('../lib/orderkuota-digital-logic.js');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/get-products', protect, async (req, res) => {
    const { authToken, authUsername } = req.body;
    if (!authToken || !authUsername) {
        return res.status(400).json({ success: false, message: 'Auth Token dan Auth Username diperlukan.' });
    }
    try {
        const digital = new OrderKuotaDigital();
        const result = await digital.getDigitalProducts(authToken, authUsername);
        res.json(result);
    } catch (error) {
        console.error("Error in /get-products:", error.message);
        res.status(500).json({ success: false, message: `Terjadi kesalahan saat mengambil produk: ${error.message}` });
    }
});

router.post('/order', protect, async (req, res) => {
    const { authToken, authUsername, voucherId, targetNumber } = req.body;
    if (!authToken || !authUsername || !voucherId || !targetNumber) {
        return res.status(400).json({ success: false, message: 'Semua parameter (authToken, authUsername, voucherId, targetNumber) diperlukan.' });
    }
    try {
        const digital = new OrderKuotaDigital();
        const result = await digital.orderDigital(authToken, authUsername, voucherId, targetNumber);
        res.json(result);
    } catch (error) {
        console.error("Error in /order:", error.message);
        res.status(500).json({ success: false, message: `Terjadi kesalahan saat memesan: ${error.message}` });
    }
});

module.exports = { router };
