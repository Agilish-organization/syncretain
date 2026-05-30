# SyncRetain

Subscription retention dashboard — cohorts, churn, MRR.

## Stack
- Node.js + Express (server.js, ≤300 lines)
- PostgreSQL via `pg`
- No ORMs, no build step

## Running locally
```bash
cp .env.example .env          # set DATABASE_URL
createdb syncretain
psql syncretain < migrations/0001_init.sql
npm install
npm start                     # listens on :8080
```

## Layout
```
server.js          entry; mounts routers, no business logic
routes/            one Router per endpoint group
  dashboard.js     GET  /           HTML dashboard with inline-SVG bars
  customers.js     POST /customers
  events.js        POST /events
  metrics.js       GET  /metrics
  seed.js          POST /seed
db/
  index.js         ONLY place that calls new Pool(); exports query helper
  customers.js     SQL for customers table
  events.js        SQL for subscription_events table
  metrics.js       aggregation queries (active, churn, MRR, cohorts)
migrations/
  0001_init.sql    customers + subscription_events DDL
test/
  smoke.test.js    node --test smoke test (hits real DB)
```

## Conventions
- `db/index.js` is the sole Pool owner — nothing else imports `pg` directly.
- All DDL lives in `migrations/` — no inline DDL in runtime files.
- Comments explain WHY, never WHAT.
- Entry file cap: 300 lines.

## Testing
```bash
npm test    # node --test --test-force-exit
```
Smoke test: POST /seed → GET /metrics → asserts numeric fields.
Requires `DATABASE_URL` pointing at a running Postgres with the migration applied.

## Endpoints
| Method | Path        | Description                        |
|--------|-------------|------------------------------------|
| GET    | /           | HTML dashboard                     |
| POST   | /customers  | {email} → 201 {id}                 |
| POST   | /events     | {customer_id, kind, mrr_cents} → 201 {id} |
| GET    | /metrics    | JSON: active_customers, churn_rate_30d, total_mrr_cents, retention_by_cohort |
| POST   | /seed       | Insert ~12 sample customers + events |
