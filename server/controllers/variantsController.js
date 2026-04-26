const { pool } = require('../config/db');
const { asInt, asMoney, asNonNegativeInt, isNonEmptyString } = require('../utils/validate');

async function listVariants(req, res) {
  const productId = req.query.product_id ? asInt(req.query.product_id) : null;
  const q = isNonEmptyString(req.query.q) ? req.query.q.trim() : null;

  const where = [];
  const values = [];

  if (productId) {
    values.push(productId);
    where.push(`v.product_id = $${values.length}`);
  }
  if (q) {
    values.push(`%${q}%`);
    where.push(`(v.sku ILIKE $${values.length} OR p.name ILIKE $${values.length})`);
  }

  const sql = `
    SELECT
      v.id, v.product_id, p.name AS product_name,
      v.sku, v.size, v.color, v.extra_attribute,
      v.price, v.stock
    FROM product_variants v
    JOIN products p ON p.id = v.product_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY p.name ASC, v.sku ASC
    LIMIT 500
  `;
  const r = await pool.query(sql, values);
  res.json({ variants: r.rows });
}

async function createVariant(req, res) {
  const { product_id, sku, size, color, extra_attribute, price, stock } = req.body || {};

  const productId = asInt(product_id);
  if (!productId) return res.status(400).json({ error: 'Invalid product_id' });
  if (!isNonEmptyString(sku)) return res.status(400).json({ error: 'SKU is required' });

  const money = asMoney(price);
  if (money === null) return res.status(400).json({ error: 'Invalid price' });

  const st = stock === undefined || stock === null ? 0 : asNonNegativeInt(stock);
  if (st === null) return res.status(400).json({ error: 'Invalid stock' });

  const r = await pool.query(
    `INSERT INTO product_variants (product_id, sku, size, color, extra_attribute, price, stock)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, product_id, sku, size, color, extra_attribute, price, stock`,
    [
      productId,
      sku.trim(),
      isNonEmptyString(size) ? size.trim() : null,
      isNonEmptyString(color) ? color.trim() : null,
      isNonEmptyString(extra_attribute) ? extra_attribute.trim() : null,
      money,
      st
    ]
  );
  res.status(201).json({ variant: r.rows[0] });
}

async function updateVariant(req, res) {
  const id = asInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const { sku, size, color, extra_attribute, price, stock } = req.body || {};
  if (!isNonEmptyString(sku)) return res.status(400).json({ error: 'SKU is required' });

  const money = asMoney(price);
  if (money === null) return res.status(400).json({ error: 'Invalid price' });

  const st = asNonNegativeInt(stock);
  if (st === null) return res.status(400).json({ error: 'Invalid stock' });

  const r = await pool.query(
    `UPDATE product_variants
     SET sku=$1, size=$2, color=$3, extra_attribute=$4, price=$5, stock=$6
     WHERE id=$7
     RETURNING id, product_id, sku, size, color, extra_attribute, price, stock`,
    [
      sku.trim(),
      isNonEmptyString(size) ? size.trim() : null,
      isNonEmptyString(color) ? color.trim() : null,
      isNonEmptyString(extra_attribute) ? extra_attribute.trim() : null,
      money,
      st,
      id
    ]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'Variant not found' });
  res.json({ variant: r.rows[0] });
}

async function deleteVariant(req, res) {
  const id = asInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const r = await pool.query('DELETE FROM product_variants WHERE id=$1 RETURNING id', [id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Variant not found' });
  res.json({ ok: true });
}

module.exports = { listVariants, createVariant, updateVariant, deleteVariant };

