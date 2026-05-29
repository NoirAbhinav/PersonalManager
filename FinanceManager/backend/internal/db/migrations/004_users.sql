-- +goose Up
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE oauth_integrations
ADD COLUMN user_id UUID REFERENCES users(id);

ALTER TABLE transactions
ADD COLUMN user_id UUID REFERENCES users(id);

ALTER TABLE sync_state
ADD COLUMN user_id UUID REFERENCES users(id);

CREATE INDEX idx_transactions_user_id
ON transactions(user_id);

CREATE INDEX idx_oauth_integrations_user_id
ON oauth_integrations(user_id);

CREATE INDEX idx_sync_state_user_id
ON sync_state(user_id);

-- +goose Down
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_oauth_integrations_user_id;
DROP INDEX IF EXISTS idx_sync_state_user_id;

ALTER TABLE sync_state DROP COLUMN user_id;
ALTER TABLE transactions DROP COLUMN user_id;
ALTER TABLE oauth_integrations DROP COLUMN user_id;

DROP TABLE users;