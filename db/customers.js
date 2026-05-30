'use strict';
const db = require('./index');

async function create(email) {
  const res = await db.query(
    'INSERT INTO customers (email) VALUES ($1) RETURNING id',
    [email]
  );
  return res.rows[0];
}

module.exports = { create };
