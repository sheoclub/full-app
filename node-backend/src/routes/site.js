const express = require('express');
const prisma = require('../prisma');
const { asyncHandler, HttpError } = require('../utils/http');
const { categorySerializer } = require('../utils/serializers');

const router = express.Router();

const provinces = ['Punjab', 'Sindh', 'Khyber Pakhtunkhwa', 'Balochistan', 'Gilgit-Baltistan', 'Azad Jammu & Kashmir', 'Islamabad'];

router.get('/settings/', asyncHandler(async (req, res) => {
    const rows = await prisma.setting.findMany();
    const data = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    data.cart_count = Object.values(req.session.cart || {}).reduce((sum, qty) => sum + Number(qty), 0);
    data.announcements = await prisma.announcement.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' } });
    res.json(data);
}));

router.get('/announcements/', asyncHandler(async (req, res) => {
    const rows = await prisma.announcement.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' } });
    res.json(rows.map((item) => ({ id: item.id, message: item.message, active: item.active, is_flash_sale: item.isFlashSale, created_at: item.createdAt })));
}));

router.post('/contact/', asyncHandler(async (req, res) => {
    const { name = '', email = '', subject = '', message = '' } = req.body;
    if (!name || !email || !message) throw new HttpError(400, 'Name, email, and message are required');
    const contact = await prisma.contactMessage.create({ data: { userId: req.user?.id || null, name, email, subject, message } });
    res.status(201).json({ message: 'Message sent successfully', id: contact.id });
}));

router.get('/delivery-charges/', asyncHandler(async (req, res) => {
    const charges = await prisma.deliveryCharge.findMany({ where: { isActive: true }, include: { tiers: true }, orderBy: [{ province: 'asc' }, { city: 'asc' }] });
    res.json(charges.map((item) => ({
        id: item.id,
        province: item.province,
        city: item.city,
        charge: String(item.charge),
        min_order_for_free: String(item.minOrderForFree),
        is_active: item.isActive,
        effective_charge: String(item.charge),
        tiers: item.tiers.map((tier) => ({ id: tier.id, delivery_charge: tier.deliveryChargeId, min_quantity: tier.minQuantity, max_quantity: tier.maxQuantity, charge: String(tier.charge) })),
        created_at: item.createdAt,
        updated_at: item.updatedAt,
    })));
}));

router.get('/delivery-charges/provinces/', (req, res) => {
    res.json(provinces.map((name) => ({ value: name, label: name })));
});

module.exports = router;
