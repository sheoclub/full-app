const express = require('express');
const { Prisma } = require('@prisma/client');
const prisma = require('../prisma');
const { asyncHandler, HttpError } = require('../utils/http');
const { productListSerializer, productDetailSerializer, categorySerializer, reviewSerializer } = require('../utils/serializers');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const productInclude = {
    category: true,
    brand: true,
    reviews: true,
    variants: true,
    galleryImages: { orderBy: { sortOrder: 'asc' } },
};

function productWhere(query) {
    const where = { status: true };
    if (query.category) where.categoryId = Number(query.category);
    if (query.is_featured != null) where.isFeatured = String(query.is_featured).toLowerCase() === 'true';
    if (query.category__name) where.category = { name: { contains: String(query.category__name), mode: 'insensitive' } };
    if (query.search) {
        where.OR = [
            { name: { contains: String(query.search), mode: 'insensitive' } },
            { description: { contains: String(query.search), mode: 'insensitive' } },
            { tags: { contains: String(query.search), mode: 'insensitive' } },
        ];
    }
    return where;
}

router.get('/products/', asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page || 1), 1);
    const pageSize = Math.min(Number(req.query.page_size || req.query.limit || 20), 100);
    const where = productWhere(req.query);
    const orderParam = String(req.query.ordering || '-created_at');
    const orderMap = { price: 'price', created_at: 'createdAt', name: 'name', stock: 'stock' };
    const clean = orderParam.replace('-', '');
    const orderBy = { [orderMap[clean] || 'createdAt']: orderParam.startsWith('-') ? 'desc' : 'asc' };
    const [count, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({ where, include: productInclude, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    res.json({ count, next: null, previous: null, results: products.map(productListSerializer) });
}));

router.get('/products/featured/', asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({ where: { status: true, isFeatured: true }, include: productInclude, orderBy: { createdAt: 'desc' }, take: 8 });
    res.json(products.map(productListSerializer));
}));

router.get('/products/new_arrivals/', asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({ where: { status: true }, include: productInclude, orderBy: { createdAt: 'desc' }, take: 8 });
    res.json(products.map(productListSerializer));
}));

router.get('/products/on_sale/', asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
        where: { status: true, comparePrice: { not: null } },
        include: productInclude,
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
    res.json(products.filter((item) => Number(item.comparePrice) > Number(item.price)).slice(0, 8).map(productListSerializer));
}));

router.get('/products/:slug/', asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({ where: { slug: req.params.slug, status: true }, include: productInclude });
    if (!product) throw new HttpError(404, 'Not found');
    res.json(productDetailSerializer(product));
}));

router.get('/products/:slug/reviews/', asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({ where: { slug: req.params.slug } });
    if (!product) throw new HttpError(404, 'Not found');
    const reviews = await prisma.review.findMany({ where: { productId: product.id }, include: { user: true }, orderBy: { createdAt: 'desc' } });
    res.json(reviews.map(reviewSerializer));
}));

router.post('/products/:slug/reviews/', requireAuth, asyncHandler(async (req, res) => {
    const product = await prisma.product.findFirst({ where: { slug: req.params.slug } });
    if (!product) throw new HttpError(404, 'Not found');
    if (!req.body.rating) throw new HttpError(400, 'Rating is required');
    const review = await prisma.review.upsert({
        where: { productId_userId: { productId: product.id, userId: req.user.id } },
        create: { productId: product.id, userId: req.user.id, rating: Number(req.body.rating), title: req.body.title || '', comment: req.body.comment || '', isApproved: true },
        update: { rating: Number(req.body.rating), title: req.body.title || '', comment: req.body.comment || '', isApproved: true },
        include: { user: true },
    });
    res.status(201).json(reviewSerializer(review));
}));

router.get('/categories/', asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({ where: { isActive: true }, include: { _count: { select: { products: true } } }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    res.json({ count: categories.length, next: null, previous: null, results: categories.map(categorySerializer) });
}));

router.get('/banners/', asyncHandler(async (req, res) => {
    const banners = await prisma.banner.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
    res.json(banners.map((banner) => ({
        id: banner.id,
        image: banner.image,
        title: banner.title,
        subtitle: banner.subtitle,
        link_url: banner.linkUrl,
        banner_type: banner.bannerType,
        active: banner.active,
        sort_order: banner.sortOrder,
        product: banner.productId,
        created_at: banner.createdAt,
        updated_at: banner.updatedAt,
    })));
}));

module.exports = router;
