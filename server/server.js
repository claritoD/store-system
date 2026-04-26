require('dotenv').config();

const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);

const { pool } = require('./config/db');
const { corsMiddleware } = require('./middleware/cors');
const { securityHeaders, jsonOnly } = require('./middleware/security');

const authRoutes = require('./routes/authRoutes');
const categoriesRoutes = require('./routes/categoriesRoutes');
const productsRoutes = require('./routes/productsRoutes');
const variantsRoutes = require('./routes/variantsRoutes');
const salesRoutes = require('./routes/salesRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

app.set('trust proxy', 1); // required for secure cookies on Render behind proxy

app.use(securityHeaders);
app.use(corsMiddleware);

app.use(express.json({ limit: '1mb' }));
app.use(jsonOnly);

const isProduction = process.env.NODE_ENV === 'production';

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: 'session',
      createTableIfMissing: false
    }),
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'store-system-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
  })
);

//app.get('/api/health', async (req, res) => {
  //const r = await pool.query('SELECT 1 AS ok');
  //res.json({ ok: true, db: r.rows[0].ok });
//});

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", db: "not checked" });
});

app.get("/", (req, res) => {
    res.send("Store System API is running");
});

app.use('/api/auth', authRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/variants', variantsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${port}`);
});

