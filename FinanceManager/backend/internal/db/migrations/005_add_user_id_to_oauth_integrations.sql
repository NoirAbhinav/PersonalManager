-- +goose Up

-- Create unique constraint for the conflict clause if it doesn't exist
ALTER TABLE oauth_integrations
ADD CONSTRAINT unique_user_provider_email UNIQUE (user_id, provider, email);

-- +goose Down

ALTER TABLE oauth_integrations
DROP CONSTRAINT unique_user_provider_email;
