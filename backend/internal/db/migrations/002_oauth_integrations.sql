-- +goose Up

CREATE TABLE oauth_integrations (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    provider TEXT NOT NULL,

    email TEXT NOT NULL,

    access_token TEXT NOT NULL,

    refresh_token TEXT NOT NULL,

    token_type TEXT,

    expiry TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW(),

    updated_at TIMESTAMP DEFAULT NOW()
);

-- +goose Down

DROP TABLE oauth_integrations;