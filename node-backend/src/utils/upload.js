const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const config = require('../config');

const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.jfif']);

if (config.cloudinary.enabled) {
    cloudinary.config(config.cloudinary);
} else {
    fs.mkdirSync(config.mediaRoot, { recursive: true });
}

const storage = config.cloudinary.enabled
    ? new CloudinaryStorage({
        cloudinary,
        params: async (req, file) => ({
            folder: config.cloudinary.folder,
            resource_type: 'image',
            public_id: crypto.randomUUID().replace(/-/g, ''),
            allowed_formats: [...allowedExtensions].map((ext) => ext.slice(1)),
        }),
    })
    : multer.diskStorage({
        destination: (req, file, cb) => cb(null, config.mediaRoot),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname || '').toLowerCase();
            cb(null, `${crypto.randomUUID().replace(/-/g, '')}${ext}`);
        },
    });

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        cb(null, allowedExtensions.has(ext));
    },
});

function uploadedFileValue(file) {
    if (!file) return '';
    return file.path || file.secure_url || file.filename || '';
}

function imageUrl(value) {
    if (!value) return '';
    const text = String(value);
    if (/^https?:\/\//i.test(text) || text.startsWith('/static/') || text.startsWith('/media/')) return text;
    return `${config.mediaUrl}${text}`;
}

function isBase64DataUrl(value) {
    return Boolean(value && typeof value === 'string' && value.startsWith('data:image/'));
}

module.exports = { upload, uploadedFileValue, imageUrl, isBase64DataUrl };
