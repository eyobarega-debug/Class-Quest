// A "pool" keeps a set of already-open PostgreSQL connections ready
// to reuse, instead of opening a brand-new connection for every
// request (which would be slow). Every file that needs the database
// imports this same pool.
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  // A background/idle client crashed. Log it, don't crash the server.
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = pool;
