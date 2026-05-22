-- migrations/00003_add_sync_status.sql
-- +goose Up
ALTER TABLE sync_state
    ADD COLUMN status TEXT NOT NULL DEFAULT 'idle',
    ADD COLUMN error TEXT;

-- +goose Down
ALTER TABLE sync_state
    DROP COLUMN status,
    DROP COLUMN error;