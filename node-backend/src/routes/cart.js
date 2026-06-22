const express = require('express');
const { Prisma } = require('@prisma/client');
const prisma = require('../prisma');
const { asyncHandler, HttpError } = require('../utils/http');
const { decimal } = require('../utils/serializers');

const router = express.Router();

function getCart(req) {
    req.session.cart = req.session.cart || {};
    return req.session.cart;
}

async function serializeCart(cart) {
    const ids = Object.keys(cart).map(Number).filter(Boolean);
    const products = await prisma.product.findMany({ where: { id: { in: ids }, status: true } });
    const byId = new Map(products.map((item) => [item.id, item]));
    let total = new Prisma.Decimal(0);
    const items = [];
    for (const [idText, qtyRaw] of Object.entries(cart)) {
        const product = byId.get(Number(idText));
        if (!product) continue;
        const quantity = Number(qtyRaw);
        const subtotal = new Prisma.Decimal(product.price).mul(quantity);
        total = total.add(subtotal);
        items.push({
            product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
                image: product.image,
                price: Number(product.price),
                compare_price: product.comparePrice == null ? null : Number(product.comparePrice),
                stock: product.stock,
                min_quantity: product.minQuantity,
                delivery_charge: Number(product.deliveryCharge),
            },
            quantity,
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
    const product = await prisma.product.findFirst({ where: { id: productId, status: true } });
    if (!product) throw new HttpError(404, 'Product not found');
    const cart = getCart(req);
    const newQty = Number(cart[String(productId)] || 0) + quantity;
    if (newQty > product.stock) throw new HttpError(400, 'Not enough stock');
    cart[String(productId)] = newQty;
    res.json({ message: 'Item added to cart', cart_count: Object.values(cart).reduce((sum, qty) => sum + Number(qty), 0), cart });
}));

router.post('/cart/update/', asyncHandler(async (req, res) => {
    const cart = {};
    for (const item of req.body.items || []) {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity || 0);
        if (quantity <= 0) continue;
        const product = await prisma.product.findFirst({ where: { id: productId, status: true } });
        if (product && quantity <= product.stock) cart[String(productId)] = quantity;
    }
    req.session.cart = cart;
    res.json({ message: 'Cart updated', cart_count: Object.values(cart).reduce((sum, qty) => sum + Number(qty), 0) });
}));

router.post('/cart/remove/:productId/', asyncHandler(async (req, res) => {
    const cart = getCart(req);
    delete cart[String(req.params.productId)];
    res.json({ message: 'Item removed from cart', cart_count: Object.values(cart).reduce((sum, qty) => sum + Number(qty), 0) });
}));

module.exports = { router, getCart, serializeCart };
