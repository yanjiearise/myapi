const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth.js');
const { OrderKuotaPascabayar } = require('../../lib/orderkuota-pascabayar-logic.js');

const servicesList = [
    { 
        name: 'Cek Tagihan Pascabayar', 
        path: '/check-bill', 
        logic: 'checkBill',
        paramName: 'targetNumber',
        paramLabel: 'Nomor Pelanggan'
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
            const targetNumber = req.body[service.paramName];
            if (!targetNumber) {
                return res.status(400).json({ success: false, message: `Parameter '${service.paramName}' diperlukan.` });
            }
            
            const authToken = "2476730:DEGe91HFZILQTPUmXyKvhlotfbjiMwsc";
            const authUsername = "defac";
            const voucherId = "2121";

            const client = new OrderKuotaPascabayar();
            const result = await client[service.logic](authToken, authUsername, voucherId, targetNumber);

            if (result.success && result.transaction_details && result.transaction_details.results) {
                const receipt = result.transaction_details.results.receipt;
                const formattedReceipt = {
                    pelanggan: {},
                    tagihan: {}
                };

                receipt.body.forEach(item => {
                    const key = item[0].toLowerCase().replace(/ /g, '_');
                    const value = item[1];
                    if (['nama', 'id_pelanggan', 'tarif_daya'].includes(key)) {
                        formattedReceipt.pelanggan[key] = value;
                    }
                    if (['tagihan', 'admin_bank', 'periode'].includes(key)) {
                        formattedReceipt.tagihan[key] = value;
                    }
                });

                return res.json({
                    success: true,
                    struk: formattedReceipt
                });
            }
            
            res.json(result);

        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
});

module.exports = { router, services };
