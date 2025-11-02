const User = require('../models/User');

const adminApiMiddleware = async (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    try {
        const user = await User.findById(req.session.user.id);
        if (user && user.role === 'admin' && user.isActive) {
            req.user = user;
            next();
        } else {
            return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

const adminPageMiddleware = async (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        const user = await User.findById(req.session.user.id);
        if (user && user.role === 'admin' && user.isActive) {
            next();
        } else {
            return res.redirect('/dashboard');
        }
    } catch (error) {
        return res.redirect('/login');
    }
};


module.exports = { adminApiMiddleware, adminPageMiddleware };
