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
SELECT
  t.id, t.user_id, t.amount, t.type, t.account_last4,
  t.merchant, t.name, t.reference_id, t.occurred_at, t.created_at,
  t.category_id,
  c.name  AS category_name,
  c.color AS category_color
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.user_id = $1
  AND (sqlc.narg('category_id')::uuid IS NULL OR t.category_id = sqlc.narg('category_id')::uuid)
  AND (sqlc.narg('type')::text        IS NULL OR t.type = sqlc.narg('type')::text)
  AND (sqlc.narg('from')::timestamptz IS NULL OR t.occurred_at >= sqlc.narg('from')::timestamptz)
  AND (sqlc.narg('to')::timestamptz   IS NULL OR t.occurred_at <= sqlc.narg('to')::timestamptz)
  AND (sqlc.narg('min_amount')::float8 IS NULL OR t.amount >= sqlc.narg('min_amount')::float8)
  AND (sqlc.narg('max_amount')::float8 IS NULL OR t.amount <= sqlc.narg('max_amount')::float8)
  AND (sqlc.narg('search')::text      IS NULL OR t.merchant ILIKE '%' || sqlc.narg('search')::text || '%'
                                              OR t.name     ILIKE '%' || sqlc.narg('search')::text || '%')
ORDER BY t.occurred_at DESC
LIMIT $2 OFFSET $3;

-- name: CountTransactionsByUserID :one
SELECT COUNT(*)
FROM transactions t
WHERE t.user_id = $1
  AND (sqlc.narg('category_id')::uuid  IS NULL OR t.category_id = sqlc.narg('category_id')::uuid)
  AND (sqlc.narg('type')::text         IS NULL OR t.type = sqlc.narg('type')::text)
  AND (sqlc.narg('from')::timestamptz  IS NULL OR t.occurred_at >= sqlc.narg('from')::timestamptz)
  AND (sqlc.narg('to')::timestamptz    IS NULL OR t.occurred_at <= sqlc.narg('to')::timestamptz)
  AND (sqlc.narg('min_amount')::float8 IS NULL OR t.amount >= sqlc.narg('min_amount')::float8)
  AND (sqlc.narg('max_amount')::float8 IS NULL OR t.amount <= sqlc.narg('max_amount')::float8)
  AND (sqlc.narg('search')::text       IS NULL OR t.merchant ILIKE '%' || sqlc.narg('search')::text || '%'
                                               OR t.name     ILIKE '%' || sqlc.narg('search')::text || '%');