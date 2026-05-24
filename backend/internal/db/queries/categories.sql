-- name: GetAllCategories :many
SELECT *
FROM categories
WHERE user_id IS NULL
   OR user_id = $1
ORDER BY is_system DESC, name ASC;

-- name: GetCategoryByID :one
SELECT *
FROM categories
WHERE id = $1;

-- name: CreateCategory :one
INSERT INTO categories (user_id, name, color, is_system)
VALUES ($1, $2, $3, false)
RETURNING *;

-- name: UpdateCategory :one
UPDATE categories
SET name = $2, color = $3
WHERE id = $1
  AND user_id IS NOT NULL
  AND is_system = false
RETURNING *;

-- name: DeleteCategory :exec
DELETE FROM categories
WHERE id = $1
  AND user_id IS NOT NULL
  AND is_system = false;

-- name: GetCategoryRules :many
SELECT *
FROM category_rules
WHERE category_id = $1
ORDER BY created_at ASC;

-- name: GetAllRulesForUser :many
SELECT cr.*
FROM category_rules cr
JOIN categories c ON c.id = cr.category_id
WHERE c.user_id IS NULL
   OR c.user_id = $1;

-- name: CreateCategoryRule :one
INSERT INTO category_rules (category_id, keyword)
VALUES ($1, $2)
RETURNING *;

-- name: DeleteCategoryRule :exec
DELETE FROM category_rules
WHERE id = $1;

-- name: SetTransactionCategory :exec
UPDATE transactions
SET category_id = $2
WHERE id = $1;

-- name: GetUncategorizedTransactions :many
SELECT *
FROM transactions
WHERE user_id = $1
  AND category_id IS NULL
ORDER BY occurred_at DESC;


-- name: ListTransactionsByUser :many
SELECT
  t.id, t.user_id, t.amount, t.type, t.account_last4,
  t.merchant, t.name, t.reference_id, t.occurred_at, t.created_at,
  t.category_id,
  c.name  AS category_name,
  c.color AS category_color
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.user_id = $1
ORDER BY t.occurred_at DESC
LIMIT $2 OFFSET $3;