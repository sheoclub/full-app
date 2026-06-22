const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const prisma = require('../prisma');
const { HttpError } = require('../utils/http');

function publicUser(user) {
    if (!user) return null;
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: firstName,
        last_name: lastName,
        name: fullName || user.username || user.email,
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        postal_code: user.postalCode || '',
        country: user.country || '',
        phone: user.phone || '',
        is_suspended: Boolean(user.isSuspended),
        is_staff: Boolean(user.isStaff),
        is_superuser: Boolean(user.isSuperuser),
        is_active: Boolean(user.isActive),
        date_joined: user.dateJoined,
        order_count: user._count?.orders || 0,
        total_spent: user.total_spent || '0.00',
    };
}

function signAccessToken(user) {
    return jwt.sign({ user_id: user.id, type: 'access' }, config.jwtSecret, { expiresIn: config.accessTokenTtl });
}

function signRefreshToken(user) {
    return jwt.sign({ user_id: user.id, type: 'refresh' }, config.jwtSecret, { expiresIn: config.refreshTokenTtl });
}

function tokensForUser(user) {
    return {
        access: signAccessToken(user),
        refresh: signRefreshToken(user),
    };
}

function verifyDjangoPbkdf2(password, hash) {
    const parts = String(hash || '').split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') return false;
    const iterations = Number(parts[1]);
    const salt = parts[2];
    const expected = parts[3];
    const derived = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64');
    return crypto.timingSafeEqual(Buffer.from(derived), Buffer.from(expected));
}

async function verifyPassword(password, hash) {
    if (!hash) return false;
    if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
        return bcrypt.compare(password, hash.replace('$2y$', '$2b$'));
    }
    if (hash.startsWith('pbkdf2_sha256$')) return verifyDjangoPbkdf2(password, hash);
    return false;
}

async function getUserFromRequest(req) {
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;
    try {
        const payload = jwt.verify(match[1], config.jwtSecret);
        if (!payload.user_id) return null;
        return prisma.user.findUnique({ where: { id: Number(payload.user_id) } });
    } catch {
        return null;
    }
}

async function attachUser(req, res, next) {
    req.user = await getUserFromRequest(req);
    next();
}

function requireAuth(req, res, next) {
    if (!req.user) return next(new HttpError(401, 'Authentication required'));
    if (req.user.isSuspended) return next(new HttpError(401, 'Invalid credentials or suspended account'));
    return next();
}

function requireAdmin(req, res, next) {
    if (!req.user) return next(new HttpError(401, 'Authentication required'));
    if (!req.user.isStaff && !req.user.isSuperuser) return next(new HttpError(403, 'Admin access required'));
    return next();
}

module.exports = {
    publicUser,
    tokensForUser,
    signAccessToken,
    signRefreshToken,
    verifyPassword,
    attachUser,
    requireAuth,
    requireAdmin,
};
