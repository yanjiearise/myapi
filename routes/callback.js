const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/User');
const ProcessedMutation = require('../models/ProcessedMutation');
const { protect } = require('../middleware/auth');
const { OrkutQrisMutasi } = require('../lib/orkut-qrmutasi-new');
const { encrypt, decrypt } = require('../utils/encrypt');
const { sendPaymentDetectedEmail } = require('../utils/mailer');
const router = express.Router();

const uploadDir = path.join(__dirname, '../public/uploads/qris');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const userId = req.session.user ? req.session.user.id : req.user._id;
        cb(null, `${userId}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 2 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar yang diizinkan!'), false);
        }
    }
});

function createMutationIdentifier(mutation) {
    const combinedString = `${mutation.tanggal}${mutation.waktu}${mutation.kredit}${mutation.keterangan}`;
    return crypto.createHash('sha256').update(combinedString).digest('hex');
}

async function processPaymentCheck(user) {
    if (!user.callbackSettings || !user.callbackSettings.isActive) {
        return { success: false, message: 'Callback tidak aktif.' };
    }
    
    const authToken = decrypt(user.callbackSettings.mutasiAuthToken);
    const authUsername = user.callbackSettings.mutasiAuthUsername;

    if (!authToken || !authUsername) {
        return { success: false, message: 'Kredensial mutasi tidak lengkap.' };
    }
    
    const orkut = new OrkutQrisMutasi();
    const history = await orkut.getHistory(authToken, authUsername);

    if (!history.success || !history.qris_history || !history.qris_history.results || history.qris_history.results.length === 0) {
        return { success: true, message: 'Tidak ada riwayat mutasi yang ditemukan.' };
    }
    
    const allMutations = history.qris_history.results;
    const latestMutation = allMutations.find(m => m.status === 'IN');

    if (!latestMutation) {
        return { success: true, message: 'Tidak ada mutasi masuk (IN) yang baru.' };
    }

    const mutationId = createMutationIdentifier(latestMutation);
    const alreadyProcessed = await ProcessedMutation.findOne({
        userId: user._id,
        mutationIdentifier: mutationId
    });

    if (alreadyProcessed) {
        return { success: true, message: 'Tidak ada mutasi baru yang perlu dinotifikasi.' };
    }

    const uniqueAmount = parseInt(latestMutation.kredit.replace(/\./g, ''));
    
    await sendPaymentDetectedEmail(user.email, { 
        uniqueAmount: uniqueAmount, 
        description: latestMutation.keterangan,
        fullDetails: latestMutation
    });

    if (user.callbackSettings.webhookUrl) {
        const payload = {
            event: "payment.detected",
            data: latestMutation
        };
        try {
            await axios.post(user.callbackSettings.webhookUrl, payload, { timeout: 10000 });
        } catch (error) {
            console.error(`Gagal mengirim webhook ke ${user.callbackSettings.webhookUrl}:`, error.message);
        }
    }
    
    await ProcessedMutation.create({
        userId: user._id,
        mutationIdentifier: mutationId
    });
            
    return { success: true, message: `1 notifikasi pembayaran baru telah dikirim.` };
}

router.post('/check', protect, async (req, res) => {
    try {
        const result = await processPaymentCheck(req.user);
        res.json(result);
    } catch (error) {
        console.error(`Callback check error untuk user ${req.user.username}:`, error);
        res.status(500).json({ success: false, message: error.message });
    }
});

router.use((req, res, next) => {
    if (!req.session.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    next();
});

router.get('/settings', async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).select('callbackSettings');
        const settings = user.callbackSettings.toObject();
        if (settings.mutasiAuthToken) {
            settings.mutasiAuthToken = decrypt(settings.mutasiAuthToken);
        }
        res.json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan.' });
    }
});

router.post('/settings', async (req, res) => {
    try {
        const { mutasiAuthUsername, mutasiAuthToken, isActive, webhookUrl } = req.body;
        const user = await User.findById(req.session.user.id);

        user.callbackSettings.mutasiAuthUsername = mutasiAuthUsername;
        user.callbackSettings.isActive = isActive;
        if (webhookUrl) {
            if (!/^https?:\/\/.+/.test(webhookUrl)) {
                 return res.status(400).json({ success: false, message: 'Format Webhook URL tidak valid.' });
            }
            user.callbackSettings.webhookUrl = webhookUrl;
        } else {
             user.callbackSettings.webhookUrl = null;
        }

        if (mutasiAuthToken) {
            user.callbackSettings.mutasiAuthToken = encrypt(mutasiAuthToken);
        }
        
        await user.save();
        res.json({ success: true, message: 'Pengaturan berhasil disimpan.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menyimpan pengaturan.' });
    }
});

router.post('/upload-qris', upload.single('qrisImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Tidak ada file yang diupload.' });
        }
        const qrisImagePath = `/uploads/qris/${req.file.filename}`;
        await User.updateOne({ _id: req.session.user.id }, { 'callbackSettings.qrisImagePath': qrisImagePath });
        res.json({ success: true, message: 'Gambar QRIS berhasil diupload.', path: qrisImagePath });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = {
    router,
    services: [
        {
            name: 'Check (Trigger Pengecekan)',
            path: '/check',
            method: 'POST'
        }
    ]
};
