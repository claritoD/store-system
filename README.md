# Inventory and Sales Tracking System

Lightweight web-based inventory + POS + reporting system for a small retail store.

## Tech

- Backend: Node.js, Express, Supabase PostgreSQL (`pg`), sessions (`express-session` + `connect-pg-simple`), bcrypt, multer, Cloudinary
- Frontend: HTML, CSS, Bootstrap 5, Vanilla JS (Fetch API)
- Deployment: Backend on Render, Frontend on Vercel, DB on Supabase, Images on Cloudinary

## Local setup

1. Install Node.js 18+.
2. In this project folder:

```bash
npm install
```

3. Create `.env` from `.env.example` and fill values.
4. Create database objects in Supabase:
   - Run `database.sql` in Supabase SQL editor
   - Run `seed.sql` in Supabase SQL editor
5. Start the backend:

```bash
npm run dev
```

6. Open the frontend:
   - For local dev, you can just open `public/login.html` in a browser, but sessions work best when served from a local static server.
   - Easiest: use VSCode/Cursor “Live Server” extension, or any simple static server on `http://localhost:5173`.
   - Set `FRONTEND_ORIGIN` in `.env` to match that origin.

Default seeded admin user:
- Username: `admin`
- Password: `admin12345`

## Deployment Guide (Free Hosting)

### 1) Setup Supabase database

1. Create a Supabase project (free tier).
2. In Supabase: **SQL Editor** → run `database.sql`.
3. Run `seed.sql` (recommended for testing).
4. Copy the **connection string** for `DATABASE_URL`:
   - Go to **Project Settings → Database → Connection string**.
   - Prefer the **Transaction pooler** connection string if available (more reliable for hosted apps).

Important:
- Supabase hosted Postgres typically requires **SSL**. The backend already enables SSL automatically in `NODE_ENV=production`.

### 2) Setup Cloudinary

1. Create a Cloudinary account (free tier).
2. Get:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

### 3) Deploy backend to Render

1. Push this project to GitHub.
2. In Render, create a new **Web Service** from your GitHub repo.
3. **Root directory**: `store-system`
4. **Build command**:

```bash
npm install
```

5. **Start command**:

```bash
npm start
```

6. **Environment variables** on Render:
   - `NODE_ENV=production`
   - `DATABASE_URL=...` (from Supabase)
   - `SESSION_SECRET=...`
   - `FRONTEND_ORIGIN=https://YOUR-VERCEL-DOMAIN.vercel.app` (**must match exactly**, no trailing slash)
   - `CLOUDINARY_CLOUD_NAME=...`
   - `CLOUDINARY_API_KEY=...`
   - `CLOUDINARY_API_SECRET=...`

Notes (Render):
- Render will provide `PORT` automatically. The server uses `process.env.PORT || 3000`.
- After deploy, verify the API health endpoint in your browser: `YOUR_RENDER_URL/api/health`
  - If you see an error, double-check `DATABASE_URL` and that you ran `database.sql` (it creates the `session` table too).

### 4) Deploy frontend to Vercel

This frontend is static HTML/JS.

Option A (recommended): put `public/` as your Vercel project root.
- Import GitHub repo into Vercel.
- Set **Root Directory** to `store-system/public`.
- Framework preset: “Other”.
- Build command: none.
- Output directory: `.` (default).

Then set your API base in one of these ways:

Option A (simple): edit `public/js/config.js`
- Set:
  - `window.API_BASE_URL = "https://your-app.onrender.com";`

Option B (recommended for no-code changes): Vercel “Injected Script”
- Vercel does not automatically inject env vars into plain HTML. To use an env var, add a tiny inline script in each page (or convert to a build step).
- For this project, **Option A is recommended** for stability and simplicity.

Option B: keep root and configure output, but Option A is simpler.

### 5) Connect frontend to backend

- Backend uses **session cookies**, so:
  - Frontend requests include `credentials: "include"`.
  - Backend allows credentials and your Vercel origin via `FRONTEND_ORIGIN`.

Cookie/CORS checklist (critical):
- Render env: `FRONTEND_ORIGIN=https://YOUR-VERCEL-DOMAIN.vercel.app`
- Frontend config: `window.API_BASE_URL="https://YOUR_RENDER_URL"`
- Use **https** on both.
- If login works but pages redirect back to login, it’s almost always an origin mismatch or missing https.

### 6) Test after deployment

1. Open the Vercel site and login.
2. Create a product + variant.
3. In **Sales POS**, checkout 1 item:
   - Stock should decrease
   - Receipt should print (browser print dialog)
4. Open **Reports** and confirm data appears.

## Project structure

```
store-system/
  server/
    config/db.js
    controllers/
    routes/
    middleware/
    server.js
  public/
    css/
    js/
    images/
    login.html
    dashboard.html
    products.html
    variants.html
    categories.html
    inventory.html
    sales.html
    reports.html
    settings.html
  uploads/
  database.sql
  seed.sql
  package.json
  README.md
```

