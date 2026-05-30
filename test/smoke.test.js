'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

// Set test DB URL before requiring app modules
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/syncretain';

const app = require('../server');
const http = require('http');

let server;
let baseUrl;

test.before(async () => {
  // Start server on a random port so the test doesn't conflict
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  // Close the pg pool so the process exits cleanly
  const db = require('../db/index');
  await db.pool.end();
});

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      method,
      hostname: '127.0.0.1',
      port: server.address().port,
      path,
      headers: { 'Content-Type': 'application/json' },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

test('POST /seed then GET /metrics returns numeric fields', async () => {
  const seedRes = await request('POST', '/seed', {});
  assert.equal(seedRes.status, 200, `seed failed: ${JSON.stringify(seedRes.body)}`);

  const metricsRes = await request('GET', '/metrics', null);
  assert.equal(metricsRes.status, 200, `metrics failed: ${JSON.stringify(metricsRes.body)}`);

  const m = metricsRes.body;
  assert.equal(typeof m.active_customers, 'number', 'active_customers should be a number');
  assert.equal(typeof m.churn_rate_30d, 'number', 'churn_rate_30d should be a number');
  assert.equal(typeof m.total_mrr_cents, 'number', 'total_mrr_cents should be a number');
  assert.ok(Array.isArray(m.retention_by_cohort), 'retention_by_cohort should be an array');
  assert.ok(m.retention_by_cohort.length > 0, 'should have at least one cohort');
});
