'use strict';
const express = require('express');
const router = express.Router();
const events = require('../db/events');

router.post('/', async (req, res) => {
  const { customer_id, kind, mrr_cents = 0 } = req.body;
  if (!customer_id || !kind) return res.status(400).json({ error: 'customer_id and kind required' });
  try {
    const row = await events.create(customer_id, kind, mrr_cents);
    res.status(201).json({ id: row.id });
  } catch (err) {
    if (err.code === '23503') return res.status(404).json({ error: 'customer not found' });
    if (err.code === '23514') return res.status(400).json({ error: 'invalid kind' });
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
