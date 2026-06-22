const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const path = require('path');
const config = require('./config');
const { attachUser } = require('./middleware/auth');
const { notFound, errorHandler } = require('./utils/http');

const authRoutes = require('./routes/auth');
const catalogRoutes = require('./routes/catalog');
const cartRoutes = require('./routes/cart').router;
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/user');
const siteRoutes = require('./routes/site');
const adminRoutes = require('./routes/admin');

const app = express();

// Vercel terminates HTTPS before Express, so trust proxy headers for secure cookies.
app.set('trust proxy', 1);

const normalizeOrigin = (value) => {
    try {
        return new URL(value).origin;
    } catch (error) {
        return '';
    }
};

const allowedOrigins = new Set(config.corsOrigins.map(normalizeOrigin).filter(Boolean));

app.use(cors({
    origin(origin, callback) {
        const requestOrigin = normalizeOrigin(origin);
        if (!origin || config.nodeEnv === 'development' || allowedOrigins.has(requestOrigin)) {
            return callback(null, true);
        }

        // Vercel same-site deployments can send an Origin header even when the API is served from the same app.
        if (requestOrigin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        return callback(null, false);
    },
    credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieSession({
    name: 'shoeclub.sid',
    keys: [config.sessionSecret],
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
}));
app.use('/media', express.static(config.mediaRoot));
app.use('/static/uploads', express.static(config.mediaRoot));
app.use(attachUser);

app.get('/health/', (req, res) => res.json({ ok: true, service: 'shoeclub-node-backend' }));
app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api', cartRoutes);
app.use('/api', orderRoutes);
app.use('/api', userRoutes);
app.use('/api', siteRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

if (require.main === module) {
    app.listen(config.port, () => {
        console.log(`Node backend listening on http://localhost:${config.port}`);
    });
}

module.exports = app;
