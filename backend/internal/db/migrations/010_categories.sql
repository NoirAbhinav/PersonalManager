-- migrations/010_categories.sql
-- +goose Up
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id),
    name        TEXT NOT NULL,
    color       TEXT NOT NULL DEFAULT '#6B7280',
    is_system   BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE category_rules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    keyword     TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

ALTER TABLE transactions
    ADD COLUMN category_id UUID REFERENCES categories(id);

-- +goose Down
ALTER TABLE transactions DROP COLUMN category_id;
DROP TABLE category_rules;
DROP TABLE categories;