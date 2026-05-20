package auth

import (
	"context"

	"github.com/NoirAbhinav/personalmanager/internal/repositories"

	"golang.org/x/oauth2"
)

func RefreshToken(
	ctx context.Context,

	oauthConfig *oauth2.Config,

	token *oauth2.Token,

	email string,

	oauthRepository *repositories.OAuthRepository,
) (*oauth2.Token, error) {

	tokenSource := oauthConfig.TokenSource(
		ctx,
		token,
	)

	freshToken, err := tokenSource.Token()

	if err != nil {
		return nil, err
	}

	err = oauthRepository.UpdateToken(
		ctx,

		email,

		freshToken.AccessToken,

		freshToken.Expiry,
	)

	if err != nil {
		return nil, err
	}

	return freshToken, nil
}
