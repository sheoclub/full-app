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

app.use(cors({
    origin(origin, callback) {
        if (!origin || config.corsOrigins.includes(origin) || config.nodeEnv === 'development') return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
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
