-- name: CreateTransaction :one

INSERT INTO transactions (
    amount,
    type,
    account_last4,
    merchant,
    name,
    reference_id,
    occurred_at
)
VALUES (
    $1, $2, $3, $4, $5, $6, $7
)
RETURNING *;


-- name: GetTransactions :many

SELECT *
FROM transactions
ORDER BY occurred_at DESC;

