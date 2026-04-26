const { pool } = require('../config/db');
const { isNonEmptyString } = require('../utils/validate');

async function getSettings(req, res) {
  const r = await pool.query('SELECT id, store_name, address, phone FROM settings ORDER BY id ASC LIMIT 1');
  res.json({ settings: r.rows[0] || null });
}

async function updateSettings(req, res) {
  const { store_name, address, phone } = req.body || {};
  if (!isNonEmptyString(store_name)) return res.status(400).json({ error: 'store_name is required' });

  const r = await pool.query(
    `UPDATE settings
     SET store_name=$1, address=$2, phone=$3
     WHERE id = (SELECT id FROM settings ORDER BY id ASC LIMIT 1)
     RETURNING id, store_name, address, phone`,
    [store_name.trim(), address || null, phone || null]
  );

  // If table was empty (shouldn't happen due to schema), insert one.
  if (!r.rows[0]) {
    const ins = await pool.query(
      `INSERT INTO settings (store_name, address, phone)
       VALUES ($1,$2,$3)
       RETURNING id, store_name, address, phone`,
      [store_name.trim(), address || null, phone || null]
    );
    return res.json({ settings: ins.rows[0] });
  }

  return res.json({ settings: r.rows[0] });
}

module.exports = { getSettings, updateSettings };

