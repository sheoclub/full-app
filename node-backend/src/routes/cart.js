const express = require('express');
const { Prisma } = require('@prisma/client');
const prisma = require('../prisma');
const { asyncHandler, HttpError } = require('../utils/http');

const router = express.Router();

function getCart(req) {
    req.session.cart = req.session.cart || {};
    return req.session.cart;
}

function cartKey(productId, variantId) {
    return variantId ? `${productId}:${variantId}` : String(productId);
}

function parseCartKey(key) {
    const [productId, variantId] = String(key).split(':').map(Number);
    return { productId, variantId: Number.isFinite(variantId) ? variantId : null };
}

async function serializeCart(cart) {
    const entries = Object.entries(cart)
        .map(([key, qtyRaw]) => ({ ...parseCartKey(key), key, quantity: Number(qtyRaw) }))
        .filter((item) => item.productId && item.quantity > 0);

    const productIds = [...new Set(entries.map((item) => item.productId))];
    const variantIds = [...new Set(entries.map((item) => item.variantId).filter(Boolean))];
    const [products, variants] = await Promise.all([
        prisma.product.findMany({ where: { id: { in: productIds }, status: true } }),
        variantIds.length
            ? prisma.productVariant.findMany({ where: { id: { in: variantIds }, isActive: true } })
            : Promise.resolve([]),
    ]);

    const productsById = new Map(products.map((item) => [item.id, item]));
    const variantsById = new Map(variants.map((item) => [item.id, item]));
    let total = new Prisma.Decimal(0);
    const items = [];

    for (const entry of entries) {
        const product = productsById.get(entry.productId);
        if (!product) continue;
        const variant = entry.variantId ? variantsById.get(entry.variantId) : null;
        if (entry.variantId && (!variant || variant.productId !== product.id)) continue;

        const unitPrice = variant?.priceOverride || product.price;
        const subtotal = new Prisma.Decimal(unitPrice).mul(entry.quantity);
        total = total.add(subtotal);
        items.push({
            key: entry.key,
            product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
                image: variant?.image || product.image,
                price: Number(unitPrice),
                compare_price: product.comparePrice == null ? null : Number(product.comparePrice),
                stock: variant?.stock ?? product.stock,
                min_quantity: product.minQuantity,
                delivery_charge: Number(product.deliveryCharge),
            },
            variant: variant ? {
                id: variant.id,
                size: variant.size,
                color: variant.color,
                color_code: variant.colorCode,
            } : undefined,
            quantity: entry.quantity,
            total_price: Number(subtotal),
            subtotal: Number(subtotal),
        });
    }

    return { items, total: Number(total), item_count: items.reduce((sum, item) => sum + item.quantity, 0) };
}

router.get('/cart/', asyncHandler(async (req, res) => {
    res.json(await serializeCart(getCart(req)));
}));

router.post('/cart/add/', asyncHandler(async (req, res) => {
    const productId = Number(req.body.product_id);
    const quantity = Number(req.body.quantity || 1);
    const variantId = req.body.variant_id ? Number(req.body.variant_id) : null;
    const product = await prisma.product.findFirst({ where: { id: productId, status: true } });
    if (!product) throw new HttpError(404, 'Product not found');

    let variant = null;
    if (variantId) {
        variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId, isActive: true } });
        if (!variant) throw new HttpError(404, 'Selected size/color is not available');
    }

    const cart = getCart(req);
    const key = cartKey(productId, variantId);
    const stock = variant?.stock ?? product.stock;
    const newQty = Number(cart[key] || 0) + quantity;
    if (newQty > stock) throw new HttpError(400, 'Not enough stock');
    cart[key] = newQty;
    req.session.cart = { ...cart };
    res.json({ message: 'Item added to cart', cart_count: Object.values(req.session.cart).reduce((sum, qty) => sum + Number(qty), 0), cart: req.session.cart });
}));

router.post('/cart/update/', asyncHandler(async (req, res) => {
    const cart = {};
    for (const item of req.body.items || []) {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity || 0);
        const variantId = item.variant_id ? Number(item.variant_id) : null;
        if (quantity <= 0) continue;
        const product = await prisma.product.findFirst({ where: { id: productId, status: true } });
        if (!product) continue;
        const variant = variantId
            ? await prisma.productVariant.findFirst({ where: { id: variantId, productId, isActive: true } })
            : null;
        if (variantId && !variant) continue;
        const stock = variant?.stock ?? product.stock;
        if (quantity <= stock) cart[cartKey(productId, variantId)] = quantity;
    }
    req.session.cart = cart;
    res.json({ message: 'Cart updated', cart_count: Object.values(cart).reduce((sum, qty) => sum + Number(qty), 0) });
}));

router.post('/cart/remove/:productId/', asyncHandler(async (req, res) => {
    const cart = getCart(req);
    const variantId = req.body.variant_id || req.query.variant_id;
    delete cart[cartKey(Number(req.params.productId), variantId ? Number(variantId) : null)];
    req.session.cart = { ...cart };
    res.json({ message: 'Item removed from cart', cart_count: Object.values(req.session.cart).reduce((sum, qty) => sum + Number(qty), 0) });
}));

module.exports = { router, getCart, serializeCart, parseCartKey };
