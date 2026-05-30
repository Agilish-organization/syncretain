'use strict';
require('dotenv').config();
const { Pool } = require('pg');

// Single pool shared across the whole process
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
