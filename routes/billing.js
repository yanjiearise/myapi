const express = require('express');
const fetch = require('node-fetch');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const router = express.Router();

const MUTASI_AUTH_TOKEN = process.env.MUTASI_AUTH_TOKEN;
const MUTASI_AUTH_USERNAME = process.env.MUTASI_AUTH_USERNAME;
const MUTASI_API_URL = "https://bovalone.me/api/orderkuota/mutasiqris";
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

async function checkAllPendingTransactions() {
    console.log("Memulai pengecekan mutasi QRIS...");
    try {
        const pendingTransactions = await Transaction.find({ status: 'pending', expiresAt: { $gt: new Date() } });
        if (pendingTransactions.length === 0) {
            return;
        }

        const response = await fetch(MUTASI_API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_API_KEY}`
            },
            body: JSON.stringify({
                authToken: MUTASI_AUTH_TOKEN,
                authUsername: MUTASI_AUTH_USERNAME
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gagal memanggil API mutasi:", response.status, errorText);
            return;
        }

        const data = await response.json();
        if (!data.success || !data.qris_history || !data.qris_history.results) {
            console.error("Respon API mutasi tidak valid.");
            return;
        }
        
        const mutations = data.qris_history.results;
        for (const trx of pendingTransactions) {
            const foundMutation = mutations.find(mutation => 
                mutation.status === 'IN' && parseInt(mutation.kredit.replace(/\./g, '')) === trx.uniqueAmount
            );

            if (foundMutation) {
                console.log(`Pembayaran ditemukan untuk transaksi ${trx._id} sejumlah ${trx.uniqueAmount}`);
                await User.updateOne({ _id: trx.user }, { $inc: { balance: trx.amount } });
                
                trx.status = 'completed';
                await trx.save();
                
                console.log(`Saldo untuk user ${trx.user} berhasil diperbarui.`);
            }
        }
    } catch (error) {
        console.error("Error saat memeriksa mutasi:", error);
    }
}

async function expirePendingTransactions() {
    try {
        const result = await Transaction.updateMany(
            { status: 'pending', expiresAt: { $lt: new Date() } },
            { $set: { status: 'expired' } }
        );
        if (result.modifiedCount > 0) {
            console.log(`✅ ${result.modifiedCount} transaksi kedaluwarsa telah diperbarui.`);
        }
    } catch (error) {
        console.error('❌ Error saat memperbarui transaksi kedaluwarsa:', error);
    }
}

setInterval(checkAllPendingTransactions, 2000);
setInterval(expirePendingTransactions, 60 * 1000);

router.post('/initiate-qris', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    
    const { amount } = req.body;
    const userId = req.session.user.id;

    if (!amount || amount < 100) {
        return res.status(400).json({ success: false, message: 'Jumlah top up minimal Rp100' });
    }

    try {
        const existingPendingTransaction = await Transaction.findOne({
            user: userId,
            status: 'pending'
        });

        if (existingPendingTransaction) {
            return res.status(409).json({ 
                success: false, 
                message: 'Anda sudah memiliki permintaan top up yang pending. Selesaikan pembayaran atau tunggu hingga kedaluwarsa.',
                pendingTransaction: {
                    orderId: existingPendingTransaction._id,
                    uniqueAmount: existingPendingTransaction.uniqueAmount,
                    expiresAt: existingPendingTransaction.expiresAt
                }
            });
        }

        let uniqueAmount;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            const uniqueCode = Math.floor(1 + Math.random() * 99);
            uniqueAmount = parseInt(amount) + uniqueCode;
            
            const existingTransaction = await Transaction.findOne({ 
                status: 'pending', 
                uniqueAmount: uniqueAmount 
            });

            if (!existingTransaction) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            return res.status(500).json({ success: false, message: 'Gagal membuat kode unik, silakan coba lagi.' });
        }

        const newTransaction = new Transaction({
            user: userId,
            amount: parseInt(amount),
            uniqueAmount: uniqueAmount
        });
        await newTransaction.save();
        
        res.json({
            success: true,
            orderId: newTransaction._id,
            uniqueAmount: newTransaction.uniqueAmount,
            expiresAt: newTransaction.expiresAt
        });

    } catch (error) {
        console.error("Initiate QRIS Error:", error);
        res.status(500).json({ success: false, message: 'Gagal memulai transaksi.' });
    }
});

router.get('/status/:orderId', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    try {
        const transaction = await Transaction.findById(req.params.orderId);
        if (!transaction || transaction.user.toString() !== req.session.user.id) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
        }
        res.json({ success: true, status: transaction.status });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memeriksa status.' });
    }
});

router.get('/balance', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    try {
        const user = await User.findById(req.session.user.id).select('balance');
        res.json({ success: true, balance: user.balance });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.get('/history', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    try {
        const transactions = await Transaction.find({ user: req.session.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, history: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil riwayat transaksi.' });
    }
});

module.exports = { router, services: [] };
