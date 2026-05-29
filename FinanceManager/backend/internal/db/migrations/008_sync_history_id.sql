-- migrations/008_sync_history_id.sql
-- +goose Up
ALTER TABLE sync_state
    ADD COLUMN history_id TEXT,
    DROP COLUMN last_message_id;

-- +goose Down
ALTER TABLE sync_state
    ADD COLUMN last_message_id TEXT,
    DROP COLUMN history_id;