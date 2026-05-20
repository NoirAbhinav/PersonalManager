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

	accessToken string,
	refreshToken string,

	tokenType string,

	expiry time.Time,
) error {

	_, err := r.queries.CreateOAuthIntegration(
		ctx,
		sqlc.CreateOAuthIntegrationParams{
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

func (r *OAuthRepository) GetByEmail(
	ctx context.Context,
	email string,
) (sqlc.OauthIntegration, error) {

	return r.queries.GetOAuthIntegrationByEmail(
		ctx,
		email,
	)
}

func (r *OAuthRepository) UpdateToken(
	ctx context.Context,

	email string,

	accessToken string,

	expiry time.Time,
) error {

	return r.queries.UpdateOAuthToken(
		ctx,
		sqlc.UpdateOAuthTokenParams{
			Email: email,

			AccessToken: accessToken,

			Expiry: pgtype.Timestamp{
				Time:  expiry,
				Valid: true,
			},
		},
	)
}
