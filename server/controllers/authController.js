const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

async function login(req, res) {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

  const result = await pool.query('SELECT id, username, password FROM users WHERE username = $1', [username]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  req.session.user = { id: user.id, username: user.username };
  return res.json({ user: req.session.user });
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Failed to logout' });
    res.clearCookie('sid');
    return res.json({ ok: true });
  });
}

function me(req, res) {
  if (!req.session || !req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ user: req.session.user });
}

module.exports = { login, logout, me };

