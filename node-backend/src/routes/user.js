const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const { asyncHandler, HttpError } = require('../utils/http');
const { requireAuth, publicUser, verifyPassword } = require('../middleware/auth');
const { productListSerializer, couponSerializer, reviewSerializer } = require('../utils/serializers');

const router = express.Router();

router.get('/user/profile/', requireAuth, asyncHandler(async (req, res) => {
    res.json(publicUser(req.user));
}));

router.patch('/user/profile/', requireAuth, asyncHandler(async (req, res) => {
    const data = {};
    const map = { first_name: 'firstName', last_name: 'lastName', address: 'address', city: 'city', state: 'state', postal_code: 'postalCode', country: 'country', phone: 'phone' };
    for (const [bodyKey, dbKey] of Object.entries(map)) {
        if (bodyKey in req.body) data[dbKey] = req.body[bodyKey];
    }
    if ('name' in req.body && !('first_name' in req.body)) {
        const [first, ...rest] = String(req.body.name || '').trim().split(' ');
        data.firstName = first || '';
        data.lastName = rest.join(' ');
    }
    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json(publicUser(user));
}));

router.post('/user/change-password/', requireAuth, asyncHandler(async (req, res) => {
    const oldPassword = String(req.body.old_password || '');
    const newPassword = String(req.body.new_password || '');
    if (!(await verifyPassword(oldPassword, req.user.password))) throw new HttpError(400, 'Current password is incorrect');
    if (newPassword.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
    await prisma.user.update({ where: { id: req.user.id }, data: { password: await bcrypt.hash(newPassword, 12) } });
    res.json({ message: 'Password changed successfully' });
}));

router.get('/wishlist/', requireAuth, asyncHandler(async (req, res) => {
    const items = await prisma.wishlist.findMany({ where: { userId: req.user.id }, include: { product: { include: { category: true, brand: true, reviews: true } } }, orderBy: { addedAt: 'desc' } });
    res.json(items.map((item) => ({ id: item.id, user: item.userId, product: item.productId, product_detail: productListSerializer(item.product), added_at: item.addedAt })));
}));

router.post('/wishlist/', requireAuth, asyncHandler(async (req, res) => {
    const productId = Number(req.body.product);
    const exists = await prisma.product.findUnique({ where: { id: productId } });
    if (!exists) throw new HttpError(404, 'Product not found');
    const item = await prisma.wishlist.upsert({
        where: { userId_productId: { userId: req.user.id, productId } },
        create: { userId: req.user.id, productId },
        update: {},
        include: { product: { include: { category: true, brand: true, reviews: true } } },
    });
    res.status(201).json({ id: item.id, user: item.userId, product: item.productId, product_detail: productListSerializer(item.product), added_at: item.addedAt });
}));

router.delete('/wishlist/:id/', requireAuth, asyncHandler(async (req, res) => {
    await prisma.wishlist.deleteMany({ where: { id: Number(req.params.id), userId: req.user.id } });
    res.status(204).send();
}));

router.get('/user/contact-messages/', requireAuth, asyncHandler(async (req, res) => {
    const messages = await prisma.contactMessage.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
    res.json(messages.map((msg) => ({ id: msg.id, user: msg.userId, name: msg.name, email: msg.email, subject: msg.subject, message: msg.message, reply: msg.reply, status: msg.status, created_at: msg.createdAt, updated_at: msg.updatedAt })));
}));

router.get('/user/notifications/', requireAuth, asyncHandler(async (req, res) => {
    const notifications = await prisma.userNotification.findMany({ where: { userId: req.user.id }, include: { coupon: true, review: { include: { user: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(notifications.map((item) => ({
        id: item.id,
        subject: item.subject,
        body: item.body,
        is_read: item.isRead,
        coupon: item.couponId,
        coupon_code: item.coupon?.code || null,
        coupon_discount: item.coupon ? `${item.coupon.discountValue}${item.coupon.discountType === 'percentage' ? '%' : ''}` : null,
        review: item.reviewId,
        review_detail: item.review ? reviewSerializer(item.review) : null,
        created_at: item.createdAt,
    })));
}));

router.patch('/user/notifications/', requireAuth, asyncHandler(async (req, res) => {
    const notificationId = req.body.notification_id ? Number(req.body.notification_id) : null;
    await prisma.userNotification.updateMany({ where: { userId: req.user.id, ...(notificationId ? { id: notificationId } : {}) }, data: { isRead: true } });
    res.json({ message: 'Notifications updated' });
}));

module.exports = router;
