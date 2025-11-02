const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { CekResi } = require('../../lib/cek-resi-logic.js');

const couriers = [
    { name: 'Shopee Express', path: '/shopee', code: 'Shopee Express' },
    { name: 'JNE', path: '/jne', code: 'JNE' },
    { name: 'J&T Express', path: '/jnt', code: 'J&T Express' },
    { name: 'J&T Cargo', path: '/jnt_cargo', code: 'J&T Cargo' },
    { name: 'SICEPAT', path: '/sicepat', code: 'SICEPAT' },
    { name: 'TIKI', path: '/tiki', code: 'TIKI' },
    { name: 'Pos Indonesia', path: '/pos', code: 'Pos Indonesia' },
    { name: 'Anteraja', path: '/anteraja', code: 'Anteraja' },
    { name: 'Lion Parcel', path: '/lion', code: 'Lion Parcel' },
    { name: 'Ninja Xpress', path: '/ninja', code: 'Ninja Xpress' },
    { name: 'ID Express', path: '/idexpress', code: 'ID Express' },
    { name: 'Wahana', path: '/wahana', code: 'Wahana' },
    { name: 'Paxel', path: '/paxel', code: 'Paxel' },
    { name: 'LEX-Lazada', path: '/lex', code: 'LEX-Lazada Logistics' },
    { name: 'GTL-GoTo', path: '/gtl', code: 'GTL-GoTo Logistics' }
];

const services = couriers.map(p => ({
    name: p.name,
    path: p.path
}));

couriers.forEach(courier => {
    router.get(`${courier.path}/config`, (req, res) => {
        res.json({
            inputs: [
                { name: 'resi', label: 'Tracking Number (Resi)', type: 'text', required: true }
            ]
        });
    });

    router.post(courier.path, protect, async (req, res) => {
        try {
            const { resi } = req.body;
            if (!resi) {
                return res.status(400).json({ success: false, message: 'Tracking Number is required.' });
            }
            
            const client = new CekResi();
            const result = await client.getResiDetails(resi, courier.code);
            res.json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });
});

module.exports = { router, services };
