const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = require('../src/prisma');

const execute = process.argv.includes('--confirm');

async function countRecords() {
    const [
        preservedAdminAccounts,
        nonAdminUsers,
        orders,
        orderItems,
        coupons,
        categories,
        announcements,
        products,
        reviews,
        banners,
        deliveryCharges,
        deliveryChargeTiers,
        settings,
    ] = await Promise.all([
        prisma.user.count({ where: { OR: [{ isStaff: true }, { isSuperuser: true }] } }),
        prisma.user.count({ where: { AND: [{ isStaff: false }, { isSuperuser: false }] } }),
        prisma.order.count(),
        prisma.orderItem.count(),
        prisma.coupon.count(),
        prisma.category.count(),
        prisma.announcement.count(),
        prisma.product.count(),
        prisma.review.count(),
        prisma.banner.count(),
        prisma.deliveryCharge.count(),
        prisma.deliveryChargeTier.count(),
        prisma.setting.count(),
    ]);

    return {
        preservedAdminAccounts,
        nonAdminUsers,
        orders,
        orderItems,
        coupons,
        categories,
        announcements,
        products,
        reviews,
        banners,
        deliveryCharges,
        deliveryChargeTiers,
        settings,
    };
}

function printCounts(title, counts) {
    console.log(`\n${title}`);
    for (const [key, value] of Object.entries(counts)) {
        console.log(`- ${key}: ${value}`);
    }
}

async function main() {
    console.log('Store database cleanup script');
    console.log('Keeps: admin/staff accounts, banners, delivery charges/tiers, and site settings.');
    console.log('Deletes: non-admin users, orders/order items, coupons/vouchers, categories, products, reviews, and announcements.');

    const before = await countRecords();
    printCounts('Current records', before);

    if (!execute) {
        console.log('\nDRY RUN ONLY. No records were deleted.');
        console.log('To execute after review, run: node scripts/cleanup-store-data.js --confirm');
        return;
    }

    if (before.preservedAdminAccounts < 1) {
        throw new Error('Cleanup stopped: no admin/staff account found to preserve.');
    }

    await prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({});
        await tx.order.deleteMany({});
        await tx.userNotification.deleteMany({});
        await tx.wishlist.deleteMany({});
        await tx.review.deleteMany({});
        await tx.contactMessage.deleteMany({});
        await tx.$executeRawUnsafe('DELETE FROM store_coupon_categories');
        await tx.coupon.deleteMany({});
        await tx.productImage.deleteMany({});
        await tx.productVariant.deleteMany({});
        await tx.product.deleteMany({});
        await tx.category.deleteMany({});
        await tx.announcement.deleteMany({});
        await tx.user.deleteMany({
            where: { AND: [{ isStaff: false }, { isSuperuser: false }] },
        });
    }, { timeout: 30000 });

    const after = await countRecords();
    printCounts('Records after cleanup', after);
    console.log('\nCleanup completed.');
}

main()
    .catch((error) => {
        console.error('\nCleanup failed:');
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
