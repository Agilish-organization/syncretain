'use strict';
const express = require('express');
const router = express.Router();
const { getMetrics } = require('../db/metrics');

function renderBar(value, max, color) {
  const pct = max > 0 ? Math.round((value / max) * 200) : 0;
  return `<rect x="0" y="0" width="${pct}" height="20" fill="${color}" rx="3"/>`;
}

router.get('/', async (req, res) => {
  try {
    const m = await getMetrics();
    const maxSignups = Math.max(...m.retention_by_cohort.map(r => r.signups), 1);

    const cohortRows = m.retention_by_cohort.map(r => {
      const cohortLabel = new Date(r.cohort).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      const retentionPct = r.signups > 0 ? Math.round((r.still_active / r.signups) * 100) : 0;
      return `
        <tr>
          <td>${cohortLabel}</td>
          <td>${r.signups}</td>
          <td>${r.still_active}</td>
          <td>${retentionPct}%</td>
          <td>
            <svg width="200" height="20" xmlns="http://www.w3.org/2000/svg">
              ${renderBar(r.signups, maxSignups, '#c7d2fe')}
              ${renderBar(r.still_active, maxSignups, '#4f46e5')}
            </svg>
          </td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>SyncRetain — Dashboard</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:system-ui,sans-serif;background:#f8fafc;color:#1e293b;padding:2rem}
  h1{font-size:1.75rem;font-weight:700;margin-bottom:1.5rem;color:#4f46e5}
  .kpis{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:2rem}
  .kpi{background:#fff;border-radius:12px;padding:1.25rem 1.75rem;box-shadow:0 1px 4px rgba(0,0,0,.08);min-width:180px}
  .kpi-label{font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:.25rem}
  .kpi-value{font-size:2rem;font-weight:700;color:#1e293b}
  .kpi-sub{font-size:.8rem;color:#94a3b8;margin-top:.15rem}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)}
  thead{background:#4f46e5;color:#fff}
  th,td{padding:.75rem 1rem;text-align:left;font-size:.875rem}
  tr:nth-child(even){background:#f1f5f9}
  h2{margin-bottom:.75rem;font-size:1.1rem;color:#334155}
  .seed-btn{margin-top:1.5rem;padding:.5rem 1.25rem;background:#4f46e5;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:.875rem}
  .seed-btn:hover{background:#4338ca}
</style>
</head>
<body>
<h1>SyncRetain</h1>
<div class="kpis">
  <div class="kpi">
    <div class="kpi-label">Active Customers</div>
    <div class="kpi-value">${m.active_customers}</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Churn Rate (30d)</div>
    <div class="kpi-value">${(m.churn_rate_30d * 100).toFixed(1)}%</div>
  </div>
  <div class="kpi">
    <div class="kpi-label">Total MRR</div>
    <div class="kpi-value">$${(m.total_mrr_cents / 100).toFixed(0)}</div>
    <div class="kpi-sub">monthly recurring revenue</div>
  </div>
</div>
<h2>Retention by Cohort</h2>
<table>
  <thead>
    <tr><th>Cohort</th><th>Signups</th><th>Still Active</th><th>Retention</th><th>Viz</th></tr>
  </thead>
  <tbody>${cohortRows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:2rem">No data — click Seed below</td></tr>'}</tbody>
</table>
<form method="POST" action="/seed" style="display:inline">
  <button class="seed-btn" type="submit">Seed sample data</button>
</form>
</body>
</html>`;

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal error');
  }
});

module.exports = router;
