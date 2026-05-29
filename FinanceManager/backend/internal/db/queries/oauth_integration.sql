-- name: UpsertOAuthIntegration :one

INSERT INTO oauth_integrations (
    user_id,
    provider,
    email,
    access_token,
    refresh_token,
    token_type,
    expiry
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
ON CONFLICT (user_id, provider, email)
DO UPDATE SET
    access_token = EXCLUDED.access_token,
    refresh_token = EXCLUDED.refresh_token,
    token_type = EXCLUDED.token_type,
    expiry = EXCLUDED.expiry,
    updated_at = NOW()
RETURNING *;


-- name: GetOAuthIntegrationByUserIDAndProvider :one

SELECT *
FROM oauth_integrations
WHERE user_id = $1
AND provider = $2
LIMIT 1;


-- name: GetOAuthIntegrationByEmail :one

SELECT *
FROM oauth_integrations
WHERE user_id = $1
AND email = $2
LIMIT 1;


-- name: UpdateOAuthToken :exec

UPDATE oauth_integrations
SET
    access_token = $2,
    expiry = $3,
    updated_at = NOW()
WHERE user_id = $1
AND provider = $4;