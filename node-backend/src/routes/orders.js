const express = require('express');
const { Prisma } = require('@prisma/client');
const prisma = require('../prisma');
const { asyncHandler, HttpError } = require('../utils/http');
const { requireAuth } = require('../middleware/auth');
const { upload, uploadedFileValue } = require('../utils/upload');
const { getCart, parseCartKey } = require('./cart');
const { orderSerializer, couponSerializer } = require('../utils/serializers');

const router = express.Router();

function couponValid(coupon) {
    const now = new Date();
    return coupon.isActive && coupon.validFrom <= now && coupon.validTo >= now && (coupon.maxUses === 0 || coupon.usedCount < coupon.maxUses);
}

function couponDiscount(coupon, total) {
    const value = new Prisma.Decimal(coupon.discountValue);
    if (coupon.discountType === 'percentage') return total.mul(value).div(100);
    return Prisma.Decimal.min(value, total);
}

router.post('/checkout/validate-coupon/', asyncHandler(async (req, res) => {
    const code = String(req.body.code || '').trim();
    const total = new Prisma.Decimal(req.body.total || 0);
    const coupon = await prisma.coupon.findFirst({ where: { code: { equals: code, mode: 'insensitive' }, isActive: true } });
    if (!coupon) throw new HttpError(400, 'Invalid coupon code');
    if (!couponValid(coupon)) throw new HttpError(400, 'Coupon expired or invalid');
    if (total.lt(coupon.minOrderAmount)) throw new HttpError(400, `Minimum order: RS ${Number(coupon.minOrderAmount).toLocaleString()}`);
    if (coupon.assignedToId && (!req.user || coupon.assignedToId !== req.user.id)) throw new HttpError(400, 'This coupon is not assigned to you');
    const discount = couponDiscount(coupon, total);
    res.json({ valid: true, code: coupon.code, discount: Number(discount), discount_type: coupon.discountType, discount_value: Number(coupon.discountValue) });
}));

router.post('/checkout/', requireAuth, upload.single('payment_proof'), asyncHandler(async (req, res) => {
    const cart = getCart(req);
    const cartEntries = Object.entries(cart)
        .map(([key, qtyRaw]) => ({ ...parseCartKey(key), key, qty: Number(qtyRaw) }))
        .filter((item) => item.productId && item.qty > 0);
    if (!cartEntries.length) throw new HttpError(400, 'Cart is empty');

    const productIds = [...new Set(cartEntries.map((item) => item.productId))];
    const variantIds = [...new Set(cartEntries.map((item) => item.variantId).filter(Boolean))];
    const [products, variants] = await Promise.all([
        prisma.product.findMany({ where: { id: { in: productIds }, status: true } }),
        variantIds.length
            ? prisma.productVariant.findMany({ where: { id: { in: variantIds }, isActive: true } })
            : Promise.resolve([]),
    ]);
    const productById = new Map(products.map((item) => [item.id, item]));
    const variantById = new Map(variants.map((item) => [item.id, item]));
    let subtotal = new Prisma.Decimal(0);
    const items = cartEntries.map((entry) => {
        const product = productById.get(entry.productId);
        const variant = entry.variantId ? variantById.get(entry.variantId) : null;
        if (!product || (entry.variantId && (!variant || variant.productId !== product.id))) return null;
        const price = variant?.priceOverride || product.price;
        subtotal = subtotal.add(new Prisma.Decimal(price).mul(entry.qty));
        return { product, variant, qty: entry.qty, price };
    }).filter(Boolean);
    if (!items.length) throw new HttpError(400, 'No valid items in cart');
    let paymentMethod = req.body.payment_method || 'Cash on Delivery';
    if (paymentMethod === 'bank_transfer') paymentMethod = 'Bank Transfer';
    if (paymentMethod === 'online') paymentMethod = 'Online Payment';
    let paymentProof = '';
    if (['Bank Transfer', 'Online Payment'].includes(paymentMethod)) {
        if (paymentMethod === 'Bank Transfer' && !req.file) throw new HttpError(400, 'Payment proof screenshot is required for bank transfer');
        if (req.file) paymentProof = uploadedFileValue(req.file);
    }
    let coupon = null;
    let discount = new Prisma.Decimal(0);
    const couponCode = String(req.body.coupon_code || '').trim();
    if (couponCode) {
        coupon = await prisma.coupon.findFirst({ where: { code: { equals: couponCode, mode: 'insensitive' } } });
        if (coupon && couponValid(coupon) && subtotal.gte(coupon.minOrderAmount) && (!coupon.assignedToId || coupon.assignedToId === req.user.id)) {
            discount = couponDiscount(coupon, subtotal);
            await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
        }
    }
    const setting = await prisma.setting.findUnique({ where: { key: 'delivery_mode' } });
    const deliveryMode = setting?.value || 'quantity';
    let shippingCost = new Prisma.Decimal(0);
    const allFree = items.every((item) => item.product.freeDelivery);
    if (!allFree && deliveryMode === 'quantity') {
        for (const item of items) {
            if (item.product.minQuantity > 1 && new Prisma.Decimal(item.product.deliveryCharge).gt(0)) {
                shippingCost = shippingCost.add(new Prisma.Decimal(item.product.deliveryCharge).mul(Math.ceil(item.qty / item.product.minQuantity)));
            }
        }
    } else if (!allFree && req.body.delivery_charge_id) {
        const dc = await prisma.deliveryCharge.findFirst({ where: { id: Number(req.body.delivery_charge_id), isActive: true }, include: { tiers: true } });
        if (dc) {
            const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
            const tier = dc.tiers.sort((a, b) => b.minQuantity - a.minQuantity).find((item) => item.minQuantity <= totalQty && (item.maxQuantity == null || item.maxQuantity >= totalQty));
            shippingCost = new Prisma.Decimal(tier?.charge || dc.charge);
        }
    }
    const grandTotal = Prisma.Decimal.max(subtotal.sub(discount), 0).add(shippingCost);
    const order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
            data: {
                userId: req.user.id,
                shippingAddress: req.body.shipping_address || '',
                city: req.body.city || '',
                phone: req.body.phone || '',
                subtotal,
                discountAmount: discount,
                shippingCost,
                total: grandTotal,
                couponId: coupon?.id,
                paidAmount: 0,
                dueAmount: grandTotal,
                paymentMethod,
                paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Unpaid' : 'Pending',
                orderStatus: ['Bank Transfer', 'Online Payment'].includes(paymentMethod) ? 'Payment Verification' : 'Processing',
                paymentProof,
            },
        });
        await tx.order.update({ where: { id: created.id }, data: { trackingNumber: `SHC-${created.id}-${Math.floor(Date.now() / 1000)}` } });
        for (const item of items) {
            await tx.orderItem.create({ data: { orderId: created.id, productId: item.product.id, variantId: item.variant?.id, quantity: item.qty, price: item.price, total: new Prisma.Decimal(item.price).mul(item.qty) } });
            if (item.variant) {
                await tx.productVariant.update({ where: { id: item.variant.id }, data: { stock: { decrement: item.qty } } });
            } else {
                await tx.product.update({ where: { id: item.product.id }, data: { stock: { decrement: item.qty } } });
            }
        }
        return tx.order.findUnique({ where: { id: created.id }, include: { user: true, coupon: true, items: { include: { product: true, variant: true } } } });
    });
    req.session.cart = {};
    res.status(201).json(orderSerializer(order));
}));

router.get('/orders/', requireAuth, asyncHandler(async (req, res) => {
    const where = req.user.isStaff ? {} : { userId: req.user.id };
    const orders = await prisma.order.findMany({ where, include: { user: true, coupon: true, items: { include: { product: true, variant: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ count: orders.length, next: null, previous: null, results: orders.map(orderSerializer) });
}));

router.get('/orders/:id/', requireAuth, asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) }, include: { user: true, coupon: true, items: { include: { product: true, variant: true } } } });
    if (!order || (!req.user.isStaff && order.userId !== req.user.id)) throw new HttpError(404, 'Not found');
    res.json(orderSerializer(order));
}));

router.post('/orders/:id/upload_proof/', requireAuth, upload.single('payment_proof'), asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'No payment proof file provided');
    const order = await prisma.order.findUnique({ where: { id: Number(req.params.id) } });
    if (!order || (!req.user.isStaff && order.userId !== req.user.id)) throw new HttpError(403, 'Not authorized');
    const existing = order.paymentProof ? order.paymentProof.split(',').filter(Boolean) : [];
    existing.push(uploadedFileValue(req.file));
    const updated = await prisma.order.update({ where: { id: order.id }, data: { paymentProof: existing.join(','), paymentStatus: 'Pending', orderStatus: 'Payment Verification' }, include: { user: true, coupon: true, items: { include: { product: true, variant: true } } } });
    res.json(orderSerializer(updated));
}));

router.get('/track-order/', asyncHandler(async (req, res) => {
    const trackingNumber = String(req.query.tracking_number || '').trim();
    if (!trackingNumber) throw new HttpError(400, 'Tracking number is required');
    const order = await prisma.order.findFirst({ where: { trackingNumber: { equals: trackingNumber, mode: 'insensitive' } }, include: { user: true, coupon: true, items: { include: { product: true, variant: true } } } });
    if (!order) throw new HttpError(404, 'Order not found with that tracking number');
    res.json(orderSerializer(order));
}));

module.exports = router;
