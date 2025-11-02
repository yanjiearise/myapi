const express = require('express');
const { adminApiMiddleware } = require('../middleware/adminAuth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const ApiLog = require('../models/ApiLog');
const Setting = require('../models/Setting');

const router = express.Router();

router.use(adminApiMiddleware);

router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalTransactions = await Transaction.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalBalance = await User.aggregate([
            { $group: { _id: null, total: { $sum: '$balance' } } }
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers,
                totalRevenue: totalTransactions[0]?.total || 0,
                totalUserBalance: totalBalance[0]?.total || 0,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/users', async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search) {
            query = {
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }
        const users = await User.find(query).select('-password -apiKeys -callbackSettings').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/users', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'ID pengguna tidak disediakan.' });
        }
        await User.deleteMany({ _id: { $in: ids } });
        res.json({ success: true, message: 'Pengguna yang dipilih berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        }
        const transactions = await Transaction.find({ user: req.params.id }).sort({ createdAt: -1 });
        
        res.json({ success: true, user, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const { username, email, balance, role, isActive } = req.body;
        const user = await User.findByIdAndUpdate(req.params.id, {
            username, email, balance, role, isActive
        }, { new: true }).select('-password -apiKeys -callbackSettings');

        res.json({ success: true, message: 'User berhasil diperbarui.', user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/transactions', async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status && status !== 'semua') {
            query.status = status;
        }
        const transactions = await Transaction.find(query).populate('user', 'username').sort({ createdAt: -1 });
        res.json({ success: true, transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/transactions', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'ID transaksi tidak disediakan.' });
        }
        await Transaction.deleteMany({ _id: { $in: ids } });
        res.json({ success: true, message: 'Transaksi yang dipilih berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/api-logs', async (req, res) => {
    try {
        const logs = await ApiLog.find().populate('userId', 'username').sort({ timestamp: -1 }).limit(100);
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/settings', async (req, res) => {
    try {
        const settings = await Setting.find({});
        const settingsMap = settings.reduce((map, item) => {
            map[item.key] = item.value;
            return map;
        }, {});
        res.json({ success: true, settings: settingsMap });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/settings', async (req, res) => {
    try {
        const { settings } = req.body;
        for (const key in settings) {
            await Setting.findOneAndUpdate(
                { key },
                { value: settings[key] },
                { upsert: true, new: true }
            );
        }
        res.json({ success: true, message: 'Pengaturan berhasil disimpan.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = { router };
