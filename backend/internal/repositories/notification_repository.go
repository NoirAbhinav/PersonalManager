package repositories

import (
	"context"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type NotificationRepository struct {
	queries *sqlc.Queries
}

func NewNotificationRepository(queries *sqlc.Queries) *NotificationRepository {
	return &NotificationRepository{queries: queries}
}

func (r *NotificationRepository) Create(
	ctx context.Context,
	userID, jobID, title, body string,
) (sqlc.Notification, error) {
	var jobUUID pgtype.UUID
	if jobID != "" {
		jobUUID = pgtype.UUID{Bytes: uuidFromString(jobID), Valid: true}
	}
	return r.queries.CreateNotification(ctx, sqlc.CreateNotificationParams{
		UserID: pgtype.UUID{Bytes: uuidFromString(userID), Valid: true},
		JobID:  jobUUID,
		Title:  title,
		Body:   body,
	})
}

func (r *NotificationRepository) GetByUserID(ctx context.Context, userID string, limit int32) ([]sqlc.Notification, error) {
	return r.queries.GetNotificationsByUserID(ctx, sqlc.GetNotificationsByUserIDParams{
		UserID: pgtype.UUID{Bytes: uuidFromString(userID), Valid: true},
		Limit:  limit,
	})
}

func (r *NotificationRepository) GetUnreadCount(ctx context.Context, userID string) (int64, error) {
	return r.queries.GetUnreadCount(ctx, pgtype.UUID{Bytes: uuidFromString(userID), Valid: true})
}

func (r *NotificationRepository) MarkRead(ctx context.Context, id, userID string) error {
	return r.queries.MarkNotificationRead(ctx, sqlc.MarkNotificationReadParams{
		ID:     pgtype.UUID{Bytes: uuidFromString(id), Valid: true},
		UserID: pgtype.UUID{Bytes: uuidFromString(userID), Valid: true},
	})
}

func (r *NotificationRepository) MarkAllRead(ctx context.Context, userID string) error {
	return r.queries.MarkAllNotificationsRead(ctx, pgtype.UUID{Bytes: uuidFromString(userID), Valid: true})
}
