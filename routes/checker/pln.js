const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth.js');
const { OrkutPlnPrabayar } = require('../../lib/pln-prabayar-logic.js');

const servicesList = [
    { 
        name: 'Cek Nama PLN Prabayar', 
        path: '/check-prabayar', 
        logic: 'checkPlnPrabayarName',
        paramName: 'meterNumber',
        paramLabel: 'Nomor Meter Pelanggan'
    }
];

const services = servicesList.map(s => ({
    name: s.name,
    path: s.path,
    method: 'POST'
}));

servicesList.forEach(service => {
    router.get(`${service.path}/config`, (req, res) => {
        res.json({
            inputs: [
                { name: service.paramName, label: service.paramLabel, type: 'text', required: true }
            ]
        });
    });

    router.post(service.path, protect, async (req, res) => {
        try {
            const customerId = req.body[service.paramName];
            if (!customerId) {
                return res.status(400).json({ success: false, message: `Parameter '${service.paramName}' diperlukan.` });
            }
            
            const client = new OrkutPlnPrabayar();
            const result = await client[service.logic](customerId);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
});

module.exports = { router, services };
