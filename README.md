# OTC Marketplace — Unicity Sphere

Universal B2C marketplace on Unicity testnet. One board, not per-project silos.

## Stack
- **Backend:** Node/Express + Supabase (Postgres) + Sphere SDK
- **Frontend:** React/Vite
- **Payments:** Sphere wallet → payment requests

## Quick Start

### 1. Supabase (database)
1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run `backend/src/db/schema.sql`
3. Run the seed insert from `backend/src/db/seed.js` or paste:
   ```sql
   INSERT INTO categories (slug, label) VALUES
     ('nft', 'NFTs'), ('domain', 'Domains'), ('service', 'Services'),
     ('token', 'Tokens'), ('hardware', 'Hardware'), ('other', 'Other')
   ON CONFLICT DO NOTHING;
   ```
4. Get your **Project Settings → Database → Connection string** (URI)

### 2. Backend
```bash
cd backend
cp .env.example .env
# Edit .env:
#   DATABASE_URL = your Supabase Postgres URI
#   SPHERE_MNEMONIC = your app wallet mnemonic
npm run dev          # API on :3001
```

### 3. Frontend
```bash
cd frontend
npm run dev          # Vite on :5173
```

Optional: add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` to `.env` to use the Supabase JS client (realtime subscriptions, etc.).
