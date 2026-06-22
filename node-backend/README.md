# Node Backend

Express/Prisma replacement backend for the Shoe Club Django API.

## Setup

```cmd
cd node-backend
copy .env.example .env
npm install
npm run prisma:generate
npm run dev
```

The server listens on port `8000` by default, matching the existing Vite proxy in `frontend/vite.config.ts`.

## Environment

Set `DATABASE_URL` to your PostgreSQL database. The Prisma schema maps to the existing Django table names such as `store_product`, `store_order`, and `store_user`.

## Important Migration Notes

- Existing Django password hashes are not bcrypt hashes. Existing users need password reset or a Django password verifier implementation before they can log in to Node.
- Uploaded files are served from `../backend/static/uploads` by default so current images continue working.
- The frontend can continue using `/api/...` routes with trailing slashes.
