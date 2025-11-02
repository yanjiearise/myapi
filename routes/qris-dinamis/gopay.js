const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { DynamicQris } = require('../../lib/dynamic-qris-logic.js');

const services = [
    {
        name: 'Create Dynamic QRIS',
        path: '/dynamic_qris'
    }
];

router.get('/dynamic_qris/config', (req, res) => {
    res.json({
        inputs: [
            { name: 'baseQrisString', label: 'Base Static QRIS String', type: 'text', required: true },
            { name: 'amount', label: 'Amount', type: 'number', required: true },
            { name: 'refId', label: 'Reference ID (Optional)', type: 'text', required: false }
        ]
    });
});

router.post('/dynamic_qris', protect, async (req, res) => {
    try {
        const { baseQrisString, refId } = req.body;
        let { amount } = req.body;
        
        amount = Number(amount);
        
        const finalQrString = DynamicQris.generate(baseQrisString, amount, refId || null);
        const qrImageDataUrl = await DynamicQris.generateQrImage(finalQrString);

        res.json({
            success: true,
            message: 'Dynamic QRIS generated successfully.',
            data: {
                amount: amount,
                referenceId: refId || null,
                qrisString: finalQrString,
                qr_image_data_url: qrImageDataUrl
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = { router, services };
