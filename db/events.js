'use strict';
const db = require('./index');

async function create(customer_id, kind, mrr_cents) {
  const res = await db.query(
    'INSERT INTO subscription_events (customer_id, kind, mrr_cents) VALUES ($1,$2,$3) RETURNING id',
    [customer_id, kind, mrr_cents]
  );
  return res.rows[0];
}

module.exports = { create };
