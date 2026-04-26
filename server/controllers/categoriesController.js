const { pool } = require('../config/db');
const { isNonEmptyString, asInt } = require('../utils/validate');

async function listCategories(req, res) {
  const r = await pool.query('SELECT id, name, description FROM categories ORDER BY name ASC');
  res.json({ categories: r.rows });
}

async function createCategory(req, res) {
  const { name, description } = req.body || {};
  if (!isNonEmptyString(name)) return res.status(400).json({ error: 'Name is required' });

  const r = await pool.query(
    'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id, name, description',
    [name.trim(), description || null]
  );
  res.status(201).json({ category: r.rows[0] });
}

async function updateCategory(req, res) {
  const id = asInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const { name, description } = req.body || {};
  if (!isNonEmptyString(name)) return res.status(400).json({ error: 'Name is required' });

  const r = await pool.query(
    'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING id, name, description',
    [name.trim(), description || null, id]
  );
  if (!r.rows[0]) return res.status(404).json({ error: 'Category not found' });
  res.json({ category: r.rows[0] });
}

async function deleteCategory(req, res) {
  const id = asInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid id' });

  const r = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
  if (!r.rows[0]) return res.status(404).json({ error: 'Category not found' });
  res.json({ ok: true });
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };

