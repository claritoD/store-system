const { Pool } = require('pg');

function createPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  // Supabase requires SSL in most hosted environments.
  const isProduction = process.env.NODE_ENV === 'production';

  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
    max: 10
  });
}

const pool = createPool();

module.exports = { pool };

