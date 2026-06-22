const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const config = require('../config');
const { asyncHandler, HttpError } = require('../utils/http');
const { publicUser, tokensForUser, verifyPassword, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/login/', asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isSuspended || !(await verifyPassword(password, user.password))) {
        throw new HttpError(401, 'Invalid credentials or suspended account');
    }
    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    res.json({ ...tokensForUser(user), user: publicUser(user) });
}));

router.post('/signup/', asyncHandler(async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim();
    if (!email || !password) throw new HttpError(400, 'Email and password are required');
    if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new HttpError(400, 'Email already registered');
    const [firstName, ...rest] = name.split(' ').filter(Boolean);
    const user = await prisma.user.create({
        data: {
            email,
            username: email,
            password: await bcrypt.hash(password, 12),
            firstName: firstName || '',
            lastName: rest.join(' '),
            phone: req.body.phone || '',
            address: req.body.address || '',
            city: req.body.city || '',
            state: req.body.state || '',
            postalCode: req.body.postal_code || '',
            country: req.body.country || '',
        },
    });
    res.status(201).json({ ...tokensForUser(user), user: publicUser(user) });
}));

router.get('/me/', requireAuth, asyncHandler(async (req, res) => {
    res.json(publicUser(req.user));
}));

router.post('/token/refresh/', asyncHandler(async (req, res) => {
    const refresh = req.body.refresh;
    try {
        const payload = jwt.verify(refresh, config.jwtSecret);
        if (payload.type !== 'refresh') throw new Error('Invalid token type');
        const user = await prisma.user.findUnique({ where: { id: Number(payload.user_id) } });
        if (!user || user.isSuspended) throw new Error('Invalid user');
        res.json(tokensForUser(user));
    } catch {
        throw new HttpError(401, 'Token is invalid or expired');
    }
}));

router.post('/token/verify/', asyncHandler(async (req, res) => {
    try {
        jwt.verify(req.body.token, config.jwtSecret);
        res.json({});
    } catch {
        throw new HttpError(401, 'Token is invalid or expired');
    }
}));

module.exports = router;
