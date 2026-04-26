const { pool } = require('../config/db');
const { isNonEmptyString } = require('../utils/validate');

function parseDate(s) {
  if (!isNonEmptyString(s)) return null;
  const d = new Date(s);
  // Accept YYYY-MM-DD
  if (Number.isNaN(d.getTime())) return null;
  return s.trim();
}

async function dailySales(req, res) {
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to);
  if (!from || !to) return res.status(400).json({ error: 'from and to are required (YYYY-MM-DD)' });

  const r = await pool.query(
    `SELECT sale_date::date AS day, COUNT(*)::int AS sales_count, COALESCE(SUM(total),0)::numeric(12,2) AS total
     FROM sales
     WHERE sale_date::date BETWEEN $1::date AND $2::date
     GROUP BY sale_date::date
     ORDER BY day ASC`,
    [from, to]
  );
  res.json({ rows: r.rows });
}

async function monthlySales(req, res) {
  const year = Number(req.query.year);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return res.status(400).json({ error: 'Invalid year' });

  const r = await pool.query(
    `SELECT to_char(date_trunc('month', sale_date), 'YYYY-MM') AS month,
            COUNT(*)::int AS sales_count,
            COALESCE(SUM(total),0)::numeric(12,2) AS total
     FROM sales
     WHERE EXTRACT(YEAR FROM sale_date) = $1
     GROUP BY date_trunc('month', sale_date)
     ORDER BY month ASC`,
    [year]
  );
  res.json({ rows: r.rows });
}

async function productSales(req, res) {
  const from = req.query.from ? parseDate(req.query.from) : null;
  const to = req.query.to ? parseDate(req.query.to) : null;

  const where = [];
  const values = [];
  if (from && to) {
    values.push(from, to);
    where.push(`s.sale_date::date BETWEEN $1::date AND $2::date`);
  }

  const sql = `
    SELECT
      p.id AS product_id,
      p.name AS product_name,
      SUM(si.quantity)::int AS qty_sold,
      COALESCE(SUM(si.quantity * si.price),0)::numeric(12,2) AS revenue
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    JOIN product_variants v ON v.id = si.variant_id
    JOIN products p ON p.id = v.product_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    GROUP BY p.id, p.name
    ORDER BY qty_sold DESC, revenue DESC
    LIMIT 200
  `;
  const r = await pool.query(sql, values);
  res.json({ rows: r.rows });
}

async function lowStock(req, res) {
  const threshold = Number(req.query.threshold || 5);
  const t = Number.isFinite(threshold) ? Math.max(0, Math.min(1000, Math.floor(threshold))) : 5;

  const r = await pool.query(
    `SELECT v.id, v.sku, v.stock, v.price,
            p.name AS product_name,
            v.size, v.color, v.extra_attribute
     FROM product_variants v
     JOIN products p ON p.id = v.product_id
     WHERE v.stock <= $1
     ORDER BY v.stock ASC, p.name ASC, v.sku ASC
     LIMIT 500`,
    [t]
  );
  res.json({ rows: r.rows, threshold: t });
}

module.exports = { dailySales, monthlySales, productSales, lowStock };

