package repositories

import (
	"context"
	"time"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type OAuthRepository struct {
	queries *sqlc.Queries
}

func NewOAuthRepository(
	queries *sqlc.Queries,
) *OAuthRepository {

	return &OAuthRepository{
		queries: queries,
	}
}
func (r *OAuthRepository) SaveGoogleToken(
	ctx context.Context,

	email string,
	user sqlc.User,
	accessToken string,
	refreshToken string,

	tokenType string,

	expiry time.Time,
) error {

	_, err := r.queries.UpsertOAuthIntegration(
		ctx,
		sqlc.UpsertOAuthIntegrationParams{
			UserID:   user.ID,
			Provider: "google",

			Email: email,

			AccessToken: accessToken,

			RefreshToken: refreshToken,

			TokenType: pgtype.Text{
				String: tokenType,
				Valid:  tokenType != "",
			},

			Expiry: pgtype.Timestamp{
				Time:  expiry,
				Valid: true,
			},
		},
	)

	return err
}

func (r *OAuthRepository) GetByUserIDAndProvider(
	ctx context.Context,
	userID pgtype.UUID,
	provider string,
) (sqlc.OauthIntegration, error) {

	return r.queries.GetOAuthIntegrationByUserIDAndProvider(
		ctx,
		sqlc.GetOAuthIntegrationByUserIDAndProviderParams{
			UserID:   userID,
			Provider: provider,
		},
	)
}

func (r *OAuthRepository) UpdateToken(
	ctx context.Context,

	userID pgtype.UUID,

	accessToken string,

	expiry time.Time,
) error {

	return r.queries.UpdateOAuthToken(
		ctx,
		sqlc.UpdateOAuthTokenParams{
			UserID: userID,

			AccessToken: accessToken,

			Expiry: pgtype.Timestamp{
				Time:  expiry,
				Valid: true,
			},
		},
	)
}

func (r *OAuthRepository) GetByEmail(
	ctx context.Context,
	userID pgtype.UUID,
	email string,
) (sqlc.OauthIntegration, error) {

	return r.queries.GetOAuthIntegrationByEmail(
		ctx,
		sqlc.GetOAuthIntegrationByEmailParams{
			UserID: userID,
			Email:  email,
		},
	)
}
