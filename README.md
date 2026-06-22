# Ladies Shoe Club - Node.js/Vercel

This project is deployment-ready for Vercel with a React/Vite frontend and a Node.js/Express API backed by Prisma/PostgreSQL.

## Project Layout

- `frontend/` - React + TypeScript + Vite storefront/admin UI.
- `node-backend/` - Express API, Prisma schema, auth, uploads, admin APIs, checkout, orders, coupons, reports, and site APIs.
- `api/index.js` - Vercel serverless entrypoint that loads the Express app.
- `vercel.json` - Vercel build, output, function, and rewrite configuration.

The Django backend has been removed from the active deployment structure.

## Vercel Deployment

Set these environment variables in the Vercel project settings:

```text
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secure_jwt_secret
SESSION_SECRET=your_secure_session_secret
NODE_ENV=production
MEDIA_ROOT=public/uploads
MEDIA_URL=/media/
CORS_ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CLOUDINARY_FOLDER=shoeclub
```

Vercel uses this root config:

```text
vercel.json
```

Build command:

```powershell
npm run prisma:generate --prefix node-backend && npm run build --prefix frontend
```

Output directory:

```text
frontend/dist
```

## Local Backend

```powershell
cd node-backend
npm install
npm run prisma:generate
npm run seed:admin
npm start
```

Backend URL: `http://localhost:8000`

Default local admin created by the seed script:

```text
admin@node.local / Admin@12345
```

## Local Frontend

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Frontend URL: `http://127.0.0.1:5173`

The Vite proxy sends `/api`, `/media`, and `/static` requests to `http://localhost:8000` locally.

## Build Check

```powershell
cd frontend
npm run build
```

The current build passes. Vite may show a non-blocking chunk-size warning.

## Media Uploads

Existing uploaded files are served from:

```text
node-backend/public/uploads
```

For Vercel production uploads, set `CLOUDINARY_URL` in the Vercel environment variables. When Cloudinary is configured, product, category, variant, gallery, banner, settings, and payment-proof uploads are stored in Cloudinary and the saved database value is the Cloudinary URL.

Do not commit Cloudinary secrets. Add the real value only in Vercel project settings or in the local ignored `node-backend/.env` file.
