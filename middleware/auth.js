const User = require('../models/User');
const ApiLog = require('../models/ApiLog');
const onFinished = require('on-finished');

const protect = async (req, res, next) => {
    let apiKey;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        apiKey = req.headers.authorization.split(' ')[1];
    }

    onFinished(res, async () => {
        if (req.user && apiKey) {
            await ApiLog.create({
                userId: req.user._id,
                apiKey: apiKey.substring(0, 11) + '...',
                endpoint: req.originalUrl,
                method: req.method,
                ipAddress: req.ip,
                statusCode: res.statusCode,
                success: res.statusCode >= 200 && res.statusCode < 300
            });
        }
    });

    if (!apiKey) {
        return res.status(401).json({ success: false, message: 'Tidak terotentikasi, API key tidak ditemukan.' });
    }

    try {
        const user = await User.findOne({ 'apiKeys.key': apiKey }).select('+apiKeys.key +isActive');
        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'API key tidak valid atau pengguna tidak aktif.' });
        }
        
        const keyDetails = user.apiKeys.find(k => k.key === apiKey);
        if (!keyDetails || keyDetails.expiresAt < new Date()) {
            return res.status(401).json({ success: false, message: 'API key tidak valid atau telah kedaluwarsa.' });
        }

        const clientIp = req.ip;
        if (user.security.whitelist.length > 0 && !user.security.whitelist.includes(clientIp)) {
            return res.status(403).json({ success: false, message: 'Akses dari IP ini tidak diizinkan.' });
        }
        
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
    }
};

module.exports = { protect };
