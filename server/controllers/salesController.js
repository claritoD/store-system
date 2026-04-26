const { pool } = require('../config/db');
const { asInt, asPositiveInt, isNonEmptyString } = require('../utils/validate');

const LOW_STOCK_THRESHOLD = 5;

async function createSale(req, res) {
  const { payment_method, items } = req.body || {};
  if (!['Cash', 'GCash', 'Card'].includes(payment_method)) {
    return res.status(400).json({ error: 'Invalid payment_method' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items are required' });
  }

  const normalized = items.map((it) => ({
    variant_id: asInt(it.variant_id),
    quantity: asPositiveInt(it.quantity)
  }));

  if (normalized.some((x) => !x.variant_id || !x.quantity)) {
    return res.status(400).json({ error: 'Invalid items' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock variants to prevent race conditions, and validate stock
    const variantIds = normalized.map((x) => x.variant_id);
    const lockRows = await client.query(
      `SELECT id, price, stock
       FROM product_variants
       WHERE id = ANY($1::bigint[])
       FOR UPDATE`,
      [variantIds]
    );

    const byId = new Map(lockRows.rows.map((r) => [Number(r.id), r]));
    for (const it of normalized) {
      const v = byId.get(Number(it.variant_id));
      if (!v) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Variant not found: ${it.variant_id}` });
      }
      if (Number(v.stock) < it.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock for variant ${it.variant_id}` });
      }
    }

    // Compute total based on DB prices
    let total = 0;
    for (const it of normalized) {
      const v = byId.get(Number(it.variant_id));
      total += Number(v.price) * it.quantity;
    }
    total = Math.round(total * 100) / 100;

    const saleRow = await client.query(
      `INSERT INTO sales (total, payment_method, sale_date)
       VALUES ($1, $2, NOW())
       RETURNING id, total, payment_method, sale_date`,
      [total, payment_method]
    );
    const sale = saleRow.rows[0];

    // Insert items and decrement stock
    for (const it of normalized) {
      const v = byId.get(Number(it.variant_id));
      await client.query(
        `INSERT INTO sale_items (sale_id, variant_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [sale.id, it.variant_id, it.quantity, v.price]
      );
      await client.query(
        `UPDATE product_variants
         SET stock = stock - $1
         WHERE id = $2`,
        [it.quantity, it.variant_id]
      );
    }

    await client.query('COMMIT');

    // Build receipt payload
    const receiptItems = await pool.query(
      `SELECT
         si.variant_id, si.quantity, si.price,
         v.sku, p.name AS product_name,
         v.size, v.color, v.extra_attribute
       FROM sale_items si
       JOIN product_variants v ON v.id = si.variant_id
       JOIN products p ON p.id = v.product_id
       WHERE si.sale_id = $1
       ORDER BY si.id ASC`,
      [sale.id]
    );

    const lowStock = await pool.query(
      `SELECT v.id, v.sku, v.stock, p.name AS product_name
       FROM product_variants v
       JOIN products p ON p.id = v.product_id
       WHERE v.stock <= $1
       ORDER BY v.stock ASC, v.sku ASC
       LIMIT 20`,
      [LOW_STOCK_THRESHOLD]
    );

    res.status(201).json({
      sale,
      items: receiptItems.rows,
      low_stock: lowStock.rows
    });
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    throw e;
  } finally {
    client.release();
  }
}

async function listSales(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const r = await pool.query(
    `SELECT id, total, payment_method, sale_date
     FROM sales
     ORDER BY sale_date DESC, id DESC
     LIMIT $1`,
    [limit]
  );
  res.json({ sales: r.rows });
}

async function getSale(req, res) {
  const id = asInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const saleR = await pool.query(
    'SELECT id, total, payment_method, sale_date FROM sales WHERE id = $1',
    [id]
  );
  if (!saleR.rows[0]) return res.status(404).json({ error: 'Sale not found' });

  const itemsR = await pool.query(
    `SELECT
       si.variant_id, si.quantity, si.price,
       v.sku, p.name AS product_name,
       v.size, v.color, v.extra_attribute
     FROM sale_items si
     JOIN product_variants v ON v.id = si.variant_id
     JOIN products p ON p.id = v.product_id
     WHERE si.sale_id = $1
     ORDER BY si.id ASC`,
    [id]
  );

  res.json({ sale: saleR.rows[0], items: itemsR.rows });
}

module.exports = { createSale, listSales, getSale };

