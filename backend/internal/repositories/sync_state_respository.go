package repositories

import (
	"context"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type SyncStateRepository struct {
	queries *sqlc.Queries
}

func NewSyncStateRepository(
	queries *sqlc.Queries,
) *SyncStateRepository {

	return &SyncStateRepository{
		queries: queries,
	}
}

func (r *SyncStateRepository) GetByEmail(
	ctx context.Context,
	email string,
) (sqlc.SyncState, error) {

	return r.queries.GetSyncStateByEmail(
		ctx,
		email,
	)
}

func (r *SyncStateRepository) SaveLastMessageID(
	ctx context.Context,

	email string,

	lastMessageID string,
) error {

	return r.queries.UpsertSyncState(
		ctx,
		sqlc.UpsertSyncStateParams{
			Provider: "gmail",

			Email: email,

			LastMessageID: pgtype.Text{
				String: lastMessageID,
				Valid:  lastMessageID != "",
			},
		},
	)
}

func (r *SyncStateRepository) UpdateStatus(
	ctx context.Context,
	email string,
	status string,
	syncErr string,
) error {
	return r.queries.UpdateSyncStatus(ctx, sqlc.UpdateSyncStatusParams{
		Email:  email,
		Status: status,
		Error:  pgtype.Text{String: syncErr, Valid: syncErr != ""},
	})
}

func (r *SyncStateRepository) GetStatus(
	ctx context.Context,
	email string,
) (sqlc.GetSyncStatusRow, error) {
	return r.queries.GetSyncStatus(ctx, email)
}
