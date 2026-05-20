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