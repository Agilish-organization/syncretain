'use strict';
const express = require('express');
const router = express.Router();
const db = require('../db/index');

// Insert sample data across 3 monthly cohorts so the dashboard isn't empty
router.post('/', async (req, res) => {
  try {
    // Clear existing seed data to keep idempotent
    await db.query('DELETE FROM subscription_events');
    await db.query('DELETE FROM customers');

    const now = new Date();
    const cohorts = [3, 2, 1]; // months ago
    let customerId = 1;
    const inserted = { customers: 0, events: 0 };

    for (const monthsAgo of cohorts) {
      const signupDate = new Date(now);
      signupDate.setMonth(signupDate.getMonth() - monthsAgo);

      // 4 customers per cohort = 12 total
      for (let i = 0; i < 4; i++) {
        const email = `user${customerId}@example.com`;
        const mrrCents = (29 + (customerId % 3) * 20) * 100; // 2900, 4900, or 6900 cents

        const cRes = await db.query(
          'INSERT INTO customers (email, signup_at) VALUES ($1, $2) RETURNING id',
          [email, signupDate]
        );
        const cid = cRes.rows[0].id;
        inserted.customers++;

        // signup event
        await db.query(
          'INSERT INTO subscription_events (customer_id, kind, occurred_at, mrr_cents) VALUES ($1,$2,$3,$4)',
          [cid, 'signup', signupDate, mrrCents]
        );
        inserted.events++;

        // oldest cohort: 2 churned, then 1 reactivated
        if (monthsAgo === 3) {
          if (i < 2) {
            const churnDate = new Date(signupDate);
            churnDate.setMonth(churnDate.getMonth() + 1);
            await db.query(
              'INSERT INTO subscription_events (customer_id, kind, occurred_at, mrr_cents) VALUES ($1,$2,$3,$4)',
              [cid, 'churn', churnDate, 0]
            );
            inserted.events++;
          }
          if (i === 0) {
            const reactDate = new Date(signupDate);
            reactDate.setMonth(reactDate.getMonth() + 2);
            await db.query(
              'INSERT INTO subscription_events (customer_id, kind, occurred_at, mrr_cents) VALUES ($1,$2,$3,$4)',
              [cid, 'reactivation', reactDate, mrrCents]
            );
            inserted.events++;
          }
        }

        // middle cohort: 1 churned recently
        if (monthsAgo === 2 && i === 3) {
          const churnDate = new Date(now);
          churnDate.setDate(churnDate.getDate() - 10);
          await db.query(
            'INSERT INTO subscription_events (customer_id, kind, occurred_at, mrr_cents) VALUES ($1,$2,$3,$4)',
            [cid, 'churn', churnDate, 0]
          );
          inserted.events++;
        }

        customerId++;
      }
    }

    res.json({ ok: true, inserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
