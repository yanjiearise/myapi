const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const { adminPageMiddleware } = require('./middleware/adminAuth');

connectDB();

const app = express();
const port = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 
    }
}));

const authMiddleware = (req, res, next) => {
    if (req.session.user) {
        next(); 
    } else {
        res.redirect('/login');
    }
};

const guestMiddleware = (req, res, next) => {
    if (req.session.user) {
        if(req.session.user.role === 'admin') return res.redirect('/panel-admin');
        res.redirect('/dashboard');
    } else {
        next();
    }
};

const apiList = [];
const routesPath = path.join(__dirname, 'routes');
fs.readdirSync(routesPath).forEach(entry => {
    const fullPath = path.join(routesPath, entry);
    const entryName = path.parse(entry).name;
    try {
        if (fs.statSync(fullPath).isFile() && entry.endsWith('.js')) {
            const routeModule = require(fullPath);
            if (routeModule.router) {
                app.use(`/api/${entryName}`, routeModule.router);
                console.log(`✅ Rute berhasil dimuat: /api/${entryName}`);
            }
        } 
        else if (fs.statSync(fullPath).isDirectory()) {
            const groupRouter = express.Router();
            fs.readdirSync(fullPath).forEach(fileInDir => {
                if (fileInDir.endsWith('.js')) {
                    const modulePath = path.join(fullPath, fileInDir);
                    const subRouteModule = require(modulePath);
                    if (subRouteModule.router) {
                        groupRouter.use(subRouteModule.router);
                    }
                    if (subRouteModule.services && Array.isArray(subRouteModule.services)) {
                        subRouteModule.services.forEach(service => {
                            apiList.push({
                                name: `${entryName} - ${service.name}`,
                                path: `/api/${entryName}${service.path}`,
                                method: service.method || null
                            });
                        });
                    }
                }
            });
            app.use(`/api/${entryName}`, groupRouter);
            console.log(`✅ Grup rute berhasil dimuat: /api/${entryName}`);
        }
    } catch (error) {
        console.error(`❌ Gagal memuat entri rute ${entry}:`, error);
    }
});

app.get('/api-list', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json([]);
    }
    res.json(apiList);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});
app.get('/login', guestMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
app.get('/register', guestMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});
app.get('/verify', guestMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify.html'));
});
app.get('/forgot-password', guestMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});
app.get('/reset-password', guestMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});
app.get('/dashboard', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/digital', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'digital.html'));
});
app.get('/profile', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});
app.get('/panel-admin', adminPageMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'panel-admin.html'));
});

module.exports = app;
