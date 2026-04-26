const multer = require('multer');
const { pool } = require('../config/db');
const { cloudinary } = require('../config/cloudinary');
const { isNonEmptyString, asInt } = require('../utils/validate');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 } // 3MB
});

async function listProducts(req, res) {
  const { q, category_id } = req.query || {};

  const where = [];
  const values = [];

  if (isNonEmptyString(q)) {
    values.push(`%${q.trim()}%`);
    where.push(`p.name ILIKE $${values.length}`);
  }
  const catId = asInt(category_id);
  if (catId) {
    values.push(catId);
    where.push(`p.category_id = $${values.length}`);
  }

  const sql = `
    SELECT
      p.id, p.name, p.category_id, c.name AS category_name,
      p.brand, p.description, p.image_url, p.created_at
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT 200
  `;

  const r = await pool.query(sql, values);
  res.json({ products: r.rows });
}

async function getProduct(req, res) {
  const id = asInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const r = await pool.query(
    `SELECT id, name, category_id, brand, description, image_url, created_at
     FROM products WHERE id = $1`,
    [id]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'Product not found' });
  res.json({ product: r.rows[0] });
}

async function createProduct(req, res) {
  const { name, category_id, brand, description } = req.body || {};
  if (!isNonEmptyString(name)) return res.status(400).json({ error: 'Name is required' });

  const catId = category_id ? asInt(category_id) : null;
  if (category_id && !catId) return res.status(400).json({ error: 'Invalid category_id' });

  let imageUrl = null;
  if (req.file) {
    if (!cloudinary) return res.status(400).json({ error: 'Cloudinary not configured on server' });
    const uploaded = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
      folder: 'store-system/products',
      resource_type: 'image'
    });
    imageUrl = uploaded.secure_url;
  } else if (isNonEmptyString(req.body.image_url)) {
    imageUrl = req.body.image_url.trim();
  }

  const r = await pool.query(
    `INSERT INTO products (name, category_id, brand, description, image_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, category_id, brand, description, image_url, created_at`,
    [name.trim(), catId, brand || null, description || null, imageUrl]
  );

  res.status(201).json({ product: r.rows[0] });
}

async function updateProduct(req, res) {
  const id = asInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const { name, category_id, brand, description } = req.body || {};
  if (!isNonEmptyString(name)) return res.status(400).json({ error: 'Name is required' });

  const catId = category_id ? asInt(category_id) : null;
  if (category_id && !catId) return res.status(400).json({ error: 'Invalid category_id' });

  let imageUrl = null;
  if (req.file) {
    if (!cloudinary) return res.status(400).json({ error: 'Cloudinary not configured on server' });
    const uploaded = await cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, {
      folder: 'store-system/products',
      resource_type: 'image'
    });
    imageUrl = uploaded.secure_url;
  } else if (Object.prototype.hasOwnProperty.call(req.body, 'image_url')) {
    imageUrl = isNonEmptyString(req.body.image_url) ? req.body.image_url.trim() : null;
  }

  const r = await pool.query(
    `UPDATE products
     SET name = $1,
         category_id = $2,
         brand = $3,
         description = $4,
         image_url = COALESCE($5, image_url)
     WHERE id = $6
     RETURNING id, name, category_id, brand, description, image_url, created_at`,
    [name.trim(), catId, brand || null, description || null, imageUrl, id]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'Product not found' });
  res.json({ product: r.rows[0] });
}

async function deleteProduct(req, res) {
  const id = asInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const r = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Product not found' });
  res.json({ ok: true });
}

module.exports = {
  upload,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};

