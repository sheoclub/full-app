const bcrypt = require('bcryptjs');
const prisma = require('../src/prisma');

async function main() {
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@node.local';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: passwordHash,
            isStaff: true,
            isSuperuser: true,
            isActive: true,
            isSuspended: false,
        },
        create: {
            email,
            username: email,
            password: passwordHash,
            firstName: 'Node',
            lastName: 'Admin',
            isStaff: true,
            isSuperuser: true,
            isActive: true,
            isSuspended: false,
        },
    });

    await prisma.setting.upsert({
        where: { key: 'site_name' },
        update: {},
        create: { key: 'site_name', value: 'Ladies Shoe Club' },
    });

    console.log(`Admin ready: ${user.email}`);
    console.log(`Password: ${password}`);
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
