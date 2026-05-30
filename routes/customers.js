'use strict';
const express = require('express');
const router = express.Router();
const customers = require('../db/customers');

router.post('/', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  try {
    const row = await customers.create(email);
    res.status(201).json({ id: row.id });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'email already exists' });
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
