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
	return r.queries.GetSyncStateByEmail(ctx, email)
}

func (r *SyncStateRepository) SaveHistoryID(
	ctx context.Context,
	email string,
	historyID string,
) error {
	return r.queries.UpsertSyncState(ctx, sqlc.UpsertSyncStateParams{
		Provider:  "gmail",
		Email:     email,
		HistoryID: pgtype.Text{String: historyID, Valid: historyID != ""},
	})
}

func (r *SyncStateRepository) GetStatus(
	ctx context.Context,
	email string,
) (sqlc.GetSyncStatusRow, error) {
	return r.queries.GetSyncStatus(ctx, email)
}
