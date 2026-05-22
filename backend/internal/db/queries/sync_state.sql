-- name: GetSyncStateByEmail :one

SELECT *
FROM sync_state
WHERE email = $1
LIMIT 1;


-- name: UpsertSyncState :exec

INSERT INTO sync_state (
    provider,
    email,
    last_message_id
)
VALUES (
    $1, $2, $3
)
ON CONFLICT (email)
DO UPDATE
SET
    last_message_id = EXCLUDED.last_message_id,
    updated_at = NOW();

-- name: UpdateSyncStatus :exec
-- name: UpdateSyncStatus :exec
INSERT INTO sync_state (provider, email, status, error, updated_at)
VALUES ('gmail', $1, $2, $3, NOW())
ON CONFLICT (email)
DO UPDATE SET
    status = EXCLUDED.status,
    error = EXCLUDED.error,
    updated_at = NOW();

-- name: GetSyncStatus :one
SELECT status, error, updated_at
FROM sync_state
WHERE email = $1;