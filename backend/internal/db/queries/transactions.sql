-- name: CreateTransaction :exec
INSERT INTO transactions (
    user_id,
    amount,
    type,
    account_last4,
    merchant,
    name,
    reference_id,
    occurred_at
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8
)
ON CONFLICT (reference_id)
DO NOTHING;

-- name: GetTransactionsByUserID :many
SELECT *
FROM transactions
WHERE user_id = $1
ORDER BY occurred_at DESC
LIMIT $2 OFFSET $3;

-- name: CountTransactionsByUserID :one
SELECT COUNT(*)
FROM transactions
WHERE user_id = $1;