-- name: CreateNotification :one
INSERT INTO notifications (user_id, job_id, title, body)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetNotificationsByUserID :many
SELECT * FROM notifications
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2;

-- name: GetUnreadCount :one
SELECT COUNT(*) FROM notifications
WHERE user_id = $1 AND read = false;

-- name: MarkNotificationRead :exec
UPDATE notifications SET read = true
WHERE id = $1 AND user_id = $2;

-- name: MarkAllNotificationsRead :exec
UPDATE notifications SET read = true
WHERE user_id = $1 AND read = false;