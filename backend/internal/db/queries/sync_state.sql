-- name: GetSyncStateByEmail :one
SELECT *
FROM sync_state
WHERE email = $1
LIMIT 1;

-- name: UpsertSyncState :exec
INSERT INTO sync_state (provider, email, history_id)
VALUES ($1, $2, $3)
ON CONFLICT (email)
DO UPDATE SET
    history_id = EXCLUDED.history_id,
    updated_at = NOW();



-- name: GetSyncStatus :one
SELECT status, error, updated_at
FROM sync_state
WHERE email = $1;