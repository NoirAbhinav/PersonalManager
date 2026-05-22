package api

import (
	"net/http"

	gmailintegration "github.com/NoirAbhinav/personalmanager/internal/integrations/gmail"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"github.com/NoirAbhinav/personalmanager/internal/services"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
)

type AuthHandler struct {
	OAuthConfig           *oauth2.Config
	oauthRepository       *repositories.OAuthRepository
	userRepository        *repositories.UserRepository
	transactionRepository *repositories.TransactionRepository
	syncStateRepository   *repositories.SyncStateRepository
}

func NewAuthHandler(
	oauthConfig *oauth2.Config,
	transactionRepository *repositories.TransactionRepository,
	oauthRepository *repositories.OAuthRepository,
	syncStateRepository *repositories.SyncStateRepository,
	userRepository *repositories.UserRepository,
) *AuthHandler {

	return &AuthHandler{
		OAuthConfig:           oauthConfig,
		transactionRepository: transactionRepository,
		oauthRepository:       oauthRepository,
		syncStateRepository:   syncStateRepository,
		userRepository:        userRepository,
	}
}
func (h *AuthHandler) GoogleLogin(c *gin.Context) {

	url := h.OAuthConfig.AuthCodeURL(
		"state-token",
		oauth2.AccessTypeOffline,
		oauth2.ApprovalForce,
	)

	c.Redirect(
		http.StatusTemporaryRedirect,
		url,
	)
}

func (h *AuthHandler) GoogleCallback(c *gin.Context) {

	ctx := c.Request.Context()

	code := c.Query("code")

	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "missing authorization code",
		})
		return
	}

	token, err := h.OAuthConfig.Exchange(
		ctx,
		code,
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
		token,
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

	email, err := gmailService.GetProfile(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	user, err := h.userRepository.GetByEmail(ctx, email)
	if err != nil {
		user, err = h.userRepository.Create(ctx, email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": err.Error(),
			})
			return
		}
	}

	err = h.oauthRepository.SaveGoogleToken(
		ctx,
		email,
		user,
		token.AccessToken,
		token.RefreshToken,
		token.TokenType,
		token.Expiry,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

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

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "transactions synced successfully",
	})
}
