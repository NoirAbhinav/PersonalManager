package api

import (
	"net/http"

	"github.com/NoirAbhinav/personalmanager/internal/auth"
	gmailintegration "github.com/NoirAbhinav/personalmanager/internal/integrations/gmail"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"github.com/NoirAbhinav/personalmanager/internal/services"
	"github.com/gin-gonic/gin"

	"golang.org/x/oauth2"
)

type SyncHandler struct {
	OAuthConfig *oauth2.Config

	oauthRepository *repositories.OAuthRepository

	transactionRepository *repositories.TransactionRepository
	syncStateRepository   *repositories.SyncStateRepository
}

func NewSyncHandler(
	oauthConfig *oauth2.Config,

	oauthRepository *repositories.OAuthRepository,

	transactionRepository *repositories.TransactionRepository,

	syncStateRepository *repositories.SyncStateRepository,
) *SyncHandler {

	return &SyncHandler{
		OAuthConfig: oauthConfig,

		oauthRepository: oauthRepository,

		transactionRepository: transactionRepository,

		syncStateRepository: syncStateRepository,
	}
}

func (h *SyncHandler) SyncGmail(
	c *gin.Context,
) {

	ctx := c.Request.Context()

	// TEMPORARY:
	// hardcoded email until auth/users added
	email := "abhinavbbps2000@gmail.com"

	integration, err := h.oauthRepository.GetByEmail(
		ctx,
		email,
	)

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	token := &oauth2.Token{
		AccessToken:  integration.AccessToken,
		RefreshToken: integration.RefreshToken,
		TokenType:    integration.TokenType.String,
		Expiry:       integration.Expiry.Time,
	}

	freshToken, err := auth.RefreshToken(
		ctx,

		h.OAuthConfig,

		token,

		email,

		h.oauthRepository,
	)

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	gmailClient, err := gmailintegration.NewClient(
		ctx,
		h.OAuthConfig,
		freshToken,
	)

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	gmailService := gmailintegration.NewService(
		gmailClient,
	)

	syncService := services.NewGmailSyncService(
		gmailService,
		h.transactionRepository,
		h.syncStateRepository,
	)

	err = syncService.SyncHDFCTransactions(ctx, email)

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "gmail sync completed",
	})
}
