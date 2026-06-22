const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const env = process.env;

const cloudinaryUrl = env.CLOUDINARY_URL || '';
let cloudinaryFromUrl = {};
try {
    if (cloudinaryUrl) {
        const parsed = new URL(cloudinaryUrl);
        cloudinaryFromUrl = {
            cloud_name: parsed.hostname,
            api_key: decodeURIComponent(parsed.username),
            api_secret: decodeURIComponent(parsed.password),
        };
    }
} catch (error) {
    cloudinaryFromUrl = {};
}

module.exports = {
    port: Number(env.PORT || 8000),
    nodeEnv: env.NODE_ENV || 'development',
    jwtSecret: env.JWT_SECRET || env.SECRET_KEY || 'dev-only-change-me',
    accessTokenTtl: env.ACCESS_TOKEN_TTL || '1d',
    refreshTokenTtl: env.REFRESH_TOKEN_TTL || '30d',
    sessionSecret: env.SESSION_SECRET || env.SECRET_KEY || 'dev-session-secret',
    corsOrigins: (env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    mediaRoot: env.MEDIA_ROOT ? path.resolve(__dirname, '..', env.MEDIA_ROOT) : path.resolve(__dirname, '../public/uploads'),
    mediaUrl: env.MEDIA_URL || '/media/',
    cloudinary: {
        enabled: Boolean(cloudinaryFromUrl.cloud_name || (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET)),
        cloud_name: env.CLOUDINARY_CLOUD_NAME || cloudinaryFromUrl.cloud_name,
        api_key: env.CLOUDINARY_API_KEY || cloudinaryFromUrl.api_key,
        api_secret: env.CLOUDINARY_API_SECRET || cloudinaryFromUrl.api_secret,
        secure: true,
        folder: env.CLOUDINARY_FOLDER || 'shoeclub',
    },
    email: {
        host: env.EMAIL_HOST || 'smtp.gmail.com',
        port: Number(env.EMAIL_PORT || 587),
        secure: String(env.EMAIL_USE_TLS || 'true').toLowerCase() === 'false',
        user: env.EMAIL_HOST_USER || '',
        pass: env.EMAIL_HOST_PASSWORD || '',
        from: env.DEFAULT_FROM_EMAIL || 'noreply@ladiesshoeclub.com',
    },
};
