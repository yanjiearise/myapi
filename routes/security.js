const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.use((req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
});

router.get('/', async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).select('security');
        res.json({ success: true, settings: user.security });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.post('/whitelist', async (req, res) => {
    const { ip } = req.body;
    try {
        await User.updateOne({ _id: req.session.user.id }, { $addToSet: { 'security.whitelist': ip } });
        res.json({ success: true, message: 'IP berhasil ditambahkan.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menambahkan IP.' });
    }
});

router.delete('/whitelist', async (req, res) => {
    const { ip } = req.body;
    try {
        await User.updateOne({ _id: req.session.user.id }, { $pull: { 'security.whitelist': ip } });
        res.json({ success: true, message: 'IP berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghapus IP.' });
    }
});

module.exports = { router, services: [] };
