-- +goose Up

CREATE TABLE sync_state (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider TEXT NOT NULL,

    email TEXT NOT NULL UNIQUE,

    last_message_id TEXT,

    updated_at TIMESTAMP DEFAULT NOW()
);

-- +goose Down

DROP TABLE sync_state;