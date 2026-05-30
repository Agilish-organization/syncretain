'use strict';
const db = require('./index');

async function getMetrics() {
  // Active customers: those with a signup event but no un-matched churn
  // Simpler: customers who have had a signup or reactivation more recently than their last churn
  const activeRes = await db.query(`
    SELECT COUNT(DISTINCT c.id) AS count
    FROM customers c
    WHERE (
      SELECT kind FROM subscription_events
      WHERE customer_id = c.id
      ORDER BY occurred_at DESC LIMIT 1
    ) IN ('signup', 'reactivation')
  `);
  const active_customers = parseInt(activeRes.rows[0].count, 10);

  // Churn rate over last 30 days: churned / (active at start of window + new signups)
  const churnRes = await db.query(`
    SELECT
      COUNT(DISTINCT CASE WHEN kind = 'churn' THEN customer_id END) AS churned,
      COUNT(DISTINCT CASE WHEN kind = 'signup' THEN customer_id END) AS signed_up
    FROM subscription_events
    WHERE occurred_at >= now() - INTERVAL '30 days'
  `);
  const churned = parseInt(churnRes.rows[0].churned, 10);
  const signed_up = parseInt(churnRes.rows[0].signed_up, 10);
  const denominator = active_customers + signed_up;
  const churn_rate_30d = denominator > 0 ? parseFloat((churned / denominator).toFixed(4)) : 0;

  // Total MRR: sum of mrr_cents for active customers' most recent signup/reactivation event
  const mrrRes = await db.query(`
    SELECT COALESCE(SUM(se.mrr_cents), 0) AS total
    FROM subscription_events se
    INNER JOIN (
      SELECT customer_id, MAX(id) AS max_id
      FROM subscription_events
      WHERE kind IN ('signup','reactivation')
      GROUP BY customer_id
    ) latest ON se.id = latest.max_id
    WHERE se.customer_id IN (
      SELECT DISTINCT customer_id
      FROM subscription_events
      WHERE kind IN ('signup','reactivation')
    )
    AND (
      SELECT kind FROM subscription_events
      WHERE customer_id = se.customer_id
      ORDER BY occurred_at DESC LIMIT 1
    ) IN ('signup','reactivation')
  `);
  const total_mrr_cents = parseInt(mrrRes.rows[0].total, 10);

  // Retention by cohort: group by signup month
  const cohortRes = await db.query(`
    SELECT
      date_trunc('month', c.signup_at) AS cohort,
      COUNT(c.id) AS signups,
      COUNT(DISTINCT CASE WHEN (
        SELECT kind FROM subscription_events
        WHERE customer_id = c.id
        ORDER BY occurred_at DESC LIMIT 1
      ) IN ('signup','reactivation') THEN c.id END) AS still_active
    FROM customers c
    GROUP BY 1
    ORDER BY 1
  `);
  const retention_by_cohort = cohortRes.rows.map(r => ({
    cohort: r.cohort,
    signups: parseInt(r.signups, 10),
    still_active: parseInt(r.still_active, 10),
  }));

  return { active_customers, churn_rate_30d, total_mrr_cents, retention_by_cohort };
}

module.exports = { getMetrics };
