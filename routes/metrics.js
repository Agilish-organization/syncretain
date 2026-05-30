'use strict';
const express = require('express');
const router = express.Router();
const { getMetrics } = require('../db/metrics');

router.get('/', async (req, res) => {
  try {
    const data = await getMetrics();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
