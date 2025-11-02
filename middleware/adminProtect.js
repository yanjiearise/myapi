const adminProtect = (req, res, next) => {
    let apiKey;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        apiKey = req.headers.authorization.split(' ')[1];
    }

    if (!apiKey) {
        return res.status(401).json({ success: false, message: 'Akses ditolak, admin API key tidak ditemukan.' });
    }

    if (apiKey === process.env.ADMIN_API_KEY) {
        next();
    } else {
        return res.status(403).json({ success: false, message: 'Admin API key tidak valid.' });
    }
};

module.exports = { adminProtect };
