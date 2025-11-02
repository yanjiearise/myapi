const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { sendChangeEmailVerificationEmail, sendUsernameChangeEmail, sendPasswordChangeEmail } = require('../utils/mailer');

const router = express.Router();

router.use((req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
});

const generateAndSendOTP = async (user, mailerFunction) => {
    const otp = crypto.randomInt(100000, 999999).toString();
    user.emailVerificationCode = otp;
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await mailerFunction(user.email, otp);
};

router.post('/request-username-change', async (req, res) => {
    try {
        const { username } = req.body;
        const user = await User.findById(req.session.user.id);

        if (username === user.username) {
            return res.status(400).json({ success: false, message: 'Ini sudah menjadi username-mu.' });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Username ini sudah digunakan.' });
        }

        await generateAndSendOTP(user, sendUsernameChangeEmail);
        res.json({ success: true, message: 'Kode verifikasi telah dikirim ke emailmu.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

router.put('/confirm-username-change', async (req, res) => {
    try {
        const { username, otp } = req.body;
        const user = await User.findById(req.session.user.id);
        
        if (user.emailVerificationCode !== otp || user.emailVerificationExpires < new Date()) {
            return res.status(400).json({ success: false, message: 'Kode OTP tidak valid atau kedaluwarsa.' });
        }

        user.username = username;
        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        req.session.user.username = username;
        res.json({ success: true, message: 'Username berhasil diperbarui.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

router.put('/update-email', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findById(req.session.user.id);

        if (email === user.email) {
            return res.json({ success: true, message: 'Email tidak berubah.' });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email ini sudah digunakan.' });
        }

        user.email = email;
        user.isEmailVerified = false;
        user.emailVerificationCode = crypto.randomInt(100000, 999999).toString();
        user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
        
        await user.save();
        await sendChangeEmailVerificationEmail(user.email, user.emailVerificationCode);

        req.session.destroy();
        res.clearCookie('connect.sid');
        
        res.json({ success: true, message: 'Email berhasil diperbarui. Kamu akan segera logout dan perlu memverifikasi email barumu.', needsReverification: true });
    } catch (error) {
         res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

router.post('/request-password-change', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
             return res.status(400).json({ success: false, message: 'Semua kolom wajib diisi.' });
        }

        const user = await User.findById(req.session.user.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Password saat ini salah.' });
        }

        await generateAndSendOTP(user, sendPasswordChangeEmail);
        res.json({ success: true, message: 'Kode verifikasi telah dikirim ke emailmu.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

router.put('/confirm-password-change', async (req, res) => {
    try {
        const { newPassword, otp } = req.body;
        const user = await User.findById(req.session.user.id);

        if (user.emailVerificationCode !== otp || user.emailVerificationExpires < new Date()) {
            return res.status(400).json({ success: false, message: 'Kode OTP tidak valid atau kedaluwarsa.' });
        }
        
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password berhasil diubah.' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

router.post('/delete-account', async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.session.user.id);
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Password salah.' });
        }

        await User.findByIdAndDelete(req.session.user.id);
        
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Gagal logout setelah hapus akun.' });
            }
            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Akun berhasil dihapus.' });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

module.exports = { router };
