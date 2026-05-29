-- migrations/009_link_transactions_to_users.sql
-- +goose Up
-- user_id column already exists, just ensure the foreign key constraint is in place
-- and backfill any NULL user_ids if needed
ALTER TABLE transactions
    ALTER COLUMN user_id SET NOT NULL;

-- +goose Down
ALTER TABLE transactions
    ALTER COLUMN user_id DROP NOT NULL;