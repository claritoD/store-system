const { pool } = require('../config/db');

const LOW_STOCK_THRESHOLD = 5;

async function getDashboard(req, res) {
  const [
    productsCount,
    variantsCount,
    todaysSales,
    monthlyRevenue,
    lowStock,
    recentSales
  ] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM products'),
    pool.query('SELECT COUNT(*)::int AS count FROM product_variants'),
    pool.query(
      `SELECT COALESCE(SUM(total), 0)::numeric(12,2) AS total
       FROM sales
       WHERE sale_date::date = (NOW() AT TIME ZONE 'UTC')::date`
    ),
    pool.query(
      `SELECT COALESCE(SUM(total), 0)::numeric(12,2) AS total
       FROM sales
       WHERE date_trunc('month', sale_date) = date_trunc('month', NOW())`
    ),
    pool.query(
      `SELECT v.id, v.sku, v.stock, p.name AS product_name
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
       WHERE v.stock <= $1
       ORDER BY v.stock ASC, v.sku ASC
       LIMIT 20`,
      [LOW_STOCK_THRESHOLD]
    ),
    pool.query(
      `SELECT id, total, payment_method, sale_date
       FROM sales
       ORDER BY sale_date DESC, id DESC
       LIMIT 10`
    )
  ]);

  res.json({
    totals: {
      products: productsCount.rows[0].count,
      variants: variantsCount.rows[0].count,
      todays_sales: Number(todaysSales.rows[0].total),
      monthly_revenue: Number(monthlyRevenue.rows[0].total)
    },
    low_stock: lowStock.rows,
    recent_sales: recentSales.rows
  });
}

module.exports = { getDashboard };

