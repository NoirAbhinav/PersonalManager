-- name: CreateOAuthIntegration :one

INSERT INTO oauth_integrations (
    provider,
    email,
    access_token,
    refresh_token,
    token_type,
    expiry
)
VALUES (
    $1, $2, $3, $4, $5, $6
)
RETURNING *;


-- name: GetOAuthIntegrationByEmail :one

SELECT *
FROM oauth_integrations
WHERE email = $1
LIMIT 1;

-- name: UpdateOAuthToken :exec

UPDATE oauth_integrations
SET
    access_token = $2,
    expiry = $3,
    updated_at = NOW()
WHERE email = $1;