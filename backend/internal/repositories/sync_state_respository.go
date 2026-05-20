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
