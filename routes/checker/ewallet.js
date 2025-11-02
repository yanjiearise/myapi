const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { OrderKuotaChecker } = require('../../lib/checkewallet-logic.js');

const providers = [
    { name: 'DANA', path: '/dana', code: 'DANA' },
    { name: 'GOPAY', path: '/gopay', code: 'GOPAY' },
    { name: 'OVO', path: '/ovo', code: 'OVO' },
    { name: 'ShopeePay', path: '/shopeepay', code: 'SHOPEEPAY' },
    { name: 'LinkAja', path: '/linkaja', code: 'LINKAJA' }
];

const services = providers.map(p => ({
    name: p.name,
    path: p.path
}));

providers.forEach(provider => {
    router.get(`${provider.path}/config`, (req, res) => {
        res.json({
            inputs: [
                { name: 'phoneNumber', label: 'Phone Number', type: 'text', required: true }
            ]
        });
    });

    router.post(provider.path, protect, async (req, res) => {
        try {
            const { phoneNumber } = req.body;
            if (!phoneNumber) {
                return res.status(400).json({ success: false, message: 'Phone Number is required.' });
            }
            
            const client = new OrderKuotaChecker();
            const result = await client.checkEwalletName(provider.code, phoneNumber);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
});

module.exports = { router, services };
