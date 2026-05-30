-- Initial schema for SyncRetain

CREATE TABLE IF NOT EXISTS customers (
  id        serial PRIMARY KEY,
  email     text UNIQUE NOT NULL,
  signup_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_events (
  id          serial PRIMARY KEY,
  customer_id int NOT NULL REFERENCES customers(id),
  kind        text NOT NULL CHECK (kind IN ('signup','churn','reactivation')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  mrr_cents   int NOT NULL DEFAULT 0
);
