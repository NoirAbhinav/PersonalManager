package runners

import (
	"context"
	"fmt"

	"github.com/NoirAbhinav/personalmanager/internal/auth"
	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/integrations/gmail"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"github.com/NoirAbhinav/personalmanager/internal/services"
	"github.com/jackc/pgx/v5/pgtype"
	"golang.org/x/oauth2"
)

type SyncRunner struct {
	oauthConfig           *oauth2.Config
	oauthRepository       *repositories.OAuthRepository
	userRepository        *repositories.UserRepository
	transactionRepository *repositories.TransactionRepository
	syncStateRepository   *repositories.SyncStateRepository
	categorizationService *services.CategorizationService
}

func NewSyncRunner(
	oauthConfig *oauth2.Config,
	oauthRepository *repositories.OAuthRepository,
	userRepository *repositories.UserRepository,
	transactionRepository *repositories.TransactionRepository,
	syncStateRepository *repositories.SyncStateRepository,
	categorizationService *services.CategorizationService,
) *SyncRunner {
	return &SyncRunner{
		oauthConfig:           oauthConfig,
		oauthRepository:       oauthRepository,
		userRepository:        userRepository,
		transactionRepository: transactionRepository,
		syncStateRepository:   syncStateRepository,
		categorizationService: categorizationService,
	}
}

func (r *SyncRunner) Run(ctx context.Context, job sqlc.ScheduledJob) (string, error) {
	userID := job.UserID

	// Get user by email — we need email for sync, fetch via GetByID workaround:
	// UserRepository only has GetByEmail, so we fetch the oauth integration first
	// to get the email, then use that.
	oauthToken, err := r.oauthRepository.GetByUserIDAndProvider(ctx, userID, "google")
	if err != nil {
		return "", fmt.Errorf("oauth token not found: %w", err)
	}

	userEmail := oauthToken.Email

	// Build oauth2.Token from stored integration
	token := &oauth2.Token{
		AccessToken:  oauthToken.AccessToken,
		RefreshToken: oauthToken.RefreshToken,
		TokenType:    oauthToken.TokenType.String,
		Expiry:       oauthToken.Expiry.Time,
	}

	// Refresh token using the correct signature
	refreshed, err := auth.RefreshToken(ctx, r.oauthConfig, token, userID, r.oauthRepository)
	if err != nil {
		return "", fmt.Errorf("token refresh failed: %w", err)
	}

	// Build Gmail client using correct signature
	gmailClient, err := gmail.NewClient(ctx, r.oauthConfig, refreshed)
	if err != nil {
		return "", fmt.Errorf("failed to create gmail client: %w", err)
	}

	gmailSvc := gmail.NewService(gmailClient)

	syncSvc := services.NewGmailSyncService(
		gmailSvc,
		r.transactionRepository,
		r.syncStateRepository,
		r.categorizationService,
	)

	userIDStr := pgtype.UUID.String(userID)
	if err := syncSvc.SyncHDFCTransactions(ctx, userEmail, userIDStr, nil); err != nil {
		return "", err
	}

	return fmt.Sprintf("sync completed for %s", userEmail), nil
}
