const { Pool } = require("pg");

// Uses DATABASE_URL from .env locally, or Vercel's env vars in production.
// Vercel/most hosted Postgres providers require SSL — this handles both
// local (no SSL) and hosted (SSL) automatically.
const isLocal = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || "");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

module.exports = pool;
