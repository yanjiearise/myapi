const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fetch = require('node-fetch');
const User = require('../models/User'); 
const { sendVerificationEmail, sendPasswordResetEmail, sendChangeEmailVerificationEmail, sendUsernameChangeEmail, sendPasswordChangeEmail } = require('../utils/mailer'); 

const router = express.Router();

async function verifyTurnstile(token, ip) {
    const secret = process.env.CLOUDFLARE_SECRET_KEY;
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}&remoteip=${encodeURIComponent(ip)}`
    });
    const data = await response.json();
    return data.success;
}

router.post('/register', async (req, res) => {
    const { username, email, password, turnstileToken } = req.body;
    
    if (!await verifyTurnstile(turnstileToken, req.ip)) {
        return res.status(400).json({ success: false, message: 'Verifikasi Captcha gagal.' });
    }

    try {
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ success: false, message: 'Username atau email sudah terdaftar.' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const verificationCode = crypto.randomInt(100000, 999999).toString();

        user = new User({
            username, email,
            password: hashedPassword,
            emailVerificationCode: verificationCode,
            emailVerificationExpires: new Date(Date.now() + 10 * 60 * 1000)
        });
        
        await user.save();
        await sendVerificationEmail(email, verificationCode);

        res.status(201).json({ success: true, message: 'Registrasi berhasil. Silakan cek emailmu untuk verifikasi.' });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
});

router.post('/verify-email', async (req, res) => {
    const { email, code } = req.body;
    try {
        const user = await User.findOne({ email, emailVerificationCode: code, emailVerificationExpires: { $gt: Date.now() } });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Kode verifikasi tidak valid atau sudah kedaluwarsa.' });
        }
        user.isEmailVerified = true;
        user.emailVerificationCode = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();
        res.json({ success: true, message: 'Email berhasil diverifikasi! Silakan login.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.post('/resend-code', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Email tidak terdaftar.' });
        }
        if (user.isEmailVerified) {
            return res.status(400).json({ success: false, message: 'Email ini sudah terverifikasi.' });
        }
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        user.emailVerificationCode = verificationCode;
        user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        await sendVerificationEmail(email, verificationCode);
        res.json({ success: true, message: 'Kode verifikasi baru telah dikirim.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password, turnstileToken } = req.body;
    if (!await verifyTurnstile(turnstileToken, req.ip)) {
        return res.status(400).json({ success: false, message: 'Verifikasi Captcha gagal.' });
    }
    try {
        const user = await User.findOne({ $or: [{ email: username }, { username: username }] });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ success: false, message: 'Username atau password salah.' });
        }
        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Akun kamu telah dinonaktifkan.' });
        }
        if (!user.isEmailVerified) {
            return res.status(401).json({ success: false, message: 'Email belum diverifikasi.', notVerified: true, email: user.email });
        }
        req.session.user = { id: user._id, username: user.username, role: user.role, email: user.email };
        res.json({ success: true, user: { username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Email tidak terdaftar.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

        await user.save();
        await sendPasswordResetEmail(user.email, resetToken);

        res.json({ success: true, message: 'Email untuk reset password telah dikirim.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal mengirim email reset password.' });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();
        res.json({ success: true, message: 'Password berhasil diubah. Silakan login.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mereset password.' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Gagal logout.' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Berhasil logout.' });
    });
});

router.get('/status', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

module.exports = { router, services: [] };
