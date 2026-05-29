package gmail

import (
	"context"

	"golang.org/x/oauth2"

	gmailapi "google.golang.org/api/gmail/v1"
	"google.golang.org/api/option"
)

func NewClient(
	ctx context.Context,
	oauthConfig *oauth2.Config,
	token *oauth2.Token,
) (*gmailapi.Service, error) {

	httpClient := oauthConfig.Client(ctx, token)

	service, err := gmailapi.NewService(
		ctx,
		option.WithHTTPClient(httpClient),
	)

	if err != nil {
		return nil, err
	}

	return service, nil
}
