-- +goose Up

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    amount DOUBLE PRECISION NOT NULL,

    type TEXT NOT NULL,

    account_last4 TEXT,

    merchant TEXT,

    name TEXT,

    reference_id TEXT UNIQUE,

    occurred_at TIMESTAMP NOT NULL,

    created_at TIMESTAMP DEFAULT NOW()
);

-- +goose Down

DROP TABLE transactions;