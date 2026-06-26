const { Prisma } = require('@prisma/client');
const { imageUrl } = require('./upload');

function decimal(value) {
    if (value == null) return '0.00';
    return new Prisma.Decimal(value).toFixed(2);
}

function number(value) {
    if (value == null) return 0;
    return Number(value);
}

function boolFromBody(value, fallback = false) {
    if (value == null) return fallback;
    if (typeof value === 'boolean') return value;
    return ['true', '1', 'yes', 'active'].includes(String(value).toLowerCase());
}

function productStats(product) {
    const reviews = product.reviews || [];
    const approved = reviews.filter((item) => item.isApproved !== false);
    const reviewCount = approved.length;
    const avg = reviewCount ? approved.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviewCount : 0;
    const price = number(product.price);
    const compare = number(product.comparePrice);
    const retail = number(product.retailPrice);
    return {
        average_rating: Math.round(avg * 10) / 10,
        review_count: reviewCount,
        discount_percentage: compare > price && compare > 0 ? Math.trunc(((compare - price) / compare) * 100) : 0,
        profit_percentage: retail > 0 ? Math.trunc(((price - retail) / retail) * 100) : 0,
    };
}

function categorySerializer(category) {
    if (!category) return null;
    return {
        id: category.id,
        name: category.name,
        description: category.description || '',
        image: category.image || '',
        sort_order: category.sortOrder || 0,
        is_active: Boolean(category.isActive),
        discount_percentage: decimal(category.discountPercentage),
        product_count: category._count?.products || 0,
        created_at: category.createdAt,
    };
}

function brandSerializer(brand) {
    if (!brand) return null;
    return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        description: brand.description || '',
        image: brand.image || '',
        website: brand.website || '',
        is_active: Boolean(brand.isActive),
        product_count: brand._count?.products || 0,
        created_at: brand.createdAt,
    };
}

function productListSerializer(product) {
    const stats = productStats(product);
    return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: decimal(product.price),
        compare_price: product.comparePrice == null ? null : decimal(product.comparePrice),
        retail_price: decimal(product.retailPrice),
        discount_percentage: stats.discount_percentage,
        profit_percentage: stats.profit_percentage,
        stock: product.stock,
        category_name: product.category?.name || null,
        brand_name: product.brand?.name || null,
        thumbnail: imageUrl(product.image),
        status: Boolean(product.status),
        is_featured: Boolean(product.isFeatured),
        free_delivery: Boolean(product.freeDelivery),
        min_quantity: product.minQuantity,
        delivery_charge: decimal(product.deliveryCharge),
        average_rating: stats.average_rating,
        review_count: stats.review_count,
        created_at: product.createdAt,
    };
}

function variantSerializer(variant) {
    return {
        id: variant.id,
        size: variant.size || '',
        color: variant.color || '',
        color_code: variant.colorCode || '',
        sku: variant.sku || '',
        price_override: variant.priceOverride == null ? null : decimal(variant.priceOverride),
        effective_price: decimal(variant.priceOverride || variant.product?.price || 0),
        stock: variant.stock,
        image: variant.image || '',
        is_active: Boolean(variant.isActive),
    };
}

function productImageSerializer(item) {
    return {
        id: item.id,
        image: item.image,
        alt_text: item.altText || '',
        sort_order: item.sortOrder || 0,
    };
}

function productDetailSerializer(product) {
    const stats = productStats(product);
    return {
        ...productListSerializer(product),
        description: product.description || '',
        category: categorySerializer(product.category),
        category_detail: categorySerializer(product.category),
        brand_id: product.brand?.id || null,
        image: product.image || '',
        image_alt: product.imageAlt || '',
        variants: (product.variants || []).map(variantSerializer),
        images: (product.galleryImages || []).map(productImageSerializer),
        thumbnail_url: product.image || '',
        is_in_stock: product.stock > 0,
        has_variants: Boolean(product.hasVariants),
        specifications: product.specifications || null,
        tags: product.tags ? product.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
        meta_title: product.metaTitle || '',
        meta_description: product.metaDescription || '',
        meta_keywords: product.metaKeywords || '',
        average_rating: stats.average_rating,
        review_count: stats.review_count,
        updated_at: product.updatedAt,
    };
}

function reviewSerializer(review) {
    const user = review.user;
    return {
        id: review.id,
        product: review.productId,
        user: review.userId,
        user_name: user ? (`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email) : '',
        rating: review.rating,
        title: review.title || '',
        comment: review.comment || '',
        is_approved: Boolean(review.isApproved),
        created_at: review.createdAt,
    };
}

function orderItemSerializer(item) {
    const productName = item.product?.name || 'Deleted product';
    const productImage = item.variant?.image || item.product?.image || '';
    const variantDetail = item.variant ? variantSerializer(item.variant) : null;
    return {
        id: item.id,
        product: item.productId,
        product_name: productName,
        name: productName,
        thumbnail: imageUrl(productImage),
        product_image: imageUrl(productImage),
        image: imageUrl(productImage),
        variant: item.variantId || null,
        variant_detail: variantDetail,
        variant_size: variantDetail?.size || '',
        variant_color: variantDetail?.color || '',
        variant_color_code: variantDetail?.color_code || '',
        variant_sku: variantDetail?.sku || '',
        quantity: item.quantity,
        price: decimal(item.price),
        total: decimal(item.total),
        subtotal: decimal(item.total),
    };
}

function orderSerializer(order) {
    const userName = order.customerName || (order.user ? (`${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || order.user.username) : '');
    return {
        id: order.id,
        user: order.userId,
        user_name: userName,
        user_email: order.customerEmail || order.user?.email || '',
        customer_name: order.customerName || '',
        customer_email: order.customerEmail || '',
        shipping_address: order.shippingAddress || '',
        city: order.city || '',
        phone: order.phone || '',
        total: decimal(order.total),
        final_total: decimal(order.total),
        subtotal: decimal(order.subtotal),
        discount_amount: decimal(order.discountAmount),
        discount: decimal(order.discountAmount),
        shipping_cost: decimal(order.shippingCost),
        paid_amount: decimal(order.paidAmount),
        due_amount: decimal(order.dueAmount),
        payment_method: order.paymentMethod || '',
        payment_status: order.paymentStatus || '',
        order_status: order.orderStatus || '',
        tracking_number: order.trackingNumber || '',
        notes: order.notes || '',
        transaction_id: '',
        payment_proof: order.paymentProof || '',
        payment_proof_url: order.paymentProof ? order.paymentProof.split(',').filter(Boolean).map(imageUrl) : [],
        items: (order.items || []).map(orderItemSerializer),
        coupon: order.couponId,
        coupon_code: order.coupon?.code || null,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
    };
}

function couponSerializer(coupon) {
    const now = new Date();
    const isValid = coupon.isActive && coupon.validFrom <= now && coupon.validTo >= now && (coupon.maxUses === 0 || coupon.usedCount < coupon.maxUses);
    return {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discountType,
        discount_value: decimal(coupon.discountValue),
        min_order_amount: decimal(coupon.minOrderAmount),
        max_uses: coupon.maxUses,
        used_count: coupon.usedCount,
        is_active: Boolean(coupon.isActive),
        valid_from: coupon.validFrom,
        valid_to: coupon.validTo,
        is_valid: isValid,
        created_at: coupon.createdAt,
        assigned_to: coupon.assignedToId,
        categories: (coupon.categories || []).map((item) => item.id),
        is_gift: Boolean(coupon.isGift),
        auto_generated: Boolean(coupon.autoGenerated),
        description: coupon.description || '',
        batch_id: coupon.batchId,
        emailed_at: coupon.emailedAt,
    };
}

module.exports = {
    decimal,
    number,
    boolFromBody,
    categorySerializer,
    brandSerializer,
    productListSerializer,
    productDetailSerializer,
    productImageSerializer,
    variantSerializer,
    reviewSerializer,
    orderSerializer,
    couponSerializer,
};
