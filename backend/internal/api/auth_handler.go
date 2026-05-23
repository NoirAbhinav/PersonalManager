package api

import (
	"crypto/rand"
	"encoding/base64"
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

func generateRandomState() string {
	b := make([]byte, 16)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

// setCookie is a helper to keep cookie config consistent across all handlers
func setCookie(c *gin.Context, name, value string, maxAge int, httpOnly bool) {
	c.SetCookie(name, value, maxAge, "/", "localhost", false, httpOnly)
}

func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	userEmail, err := c.Cookie("session_user")
	if err == nil && userEmail != "" {
		ctx := c.Request.Context()
		_, err := h.userRepository.GetByEmail(ctx, userEmail)
		if err == nil {
			c.Redirect(http.StatusTemporaryRedirect, "http://localhost:3000/dashboard")
			return
		}
		setCookie(c, "session_user", "", -1, true)
	}

	state := generateRandomState()
	setCookie(c, "oauth_state", state, 300, true)
	url := h.OAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	c.Redirect(http.StatusTemporaryRedirect, url)
}

func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	ctx := c.Request.Context()

	// Verify state to prevent CSRF
	stateCookie, err := c.Cookie("oauth_state")
	if err != nil || stateCookie != c.Query("state") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid state parameter"})
		return
	}
	setCookie(c, "oauth_state", "", -1, true)

	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing authorization code"})
		return
	}

	token, err := h.OAuthConfig.Exchange(ctx, code)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	gmailClient, err := gmailintegration.NewClient(ctx, h.OAuthConfig, token)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	gmailService := gmailintegration.NewService(gmailClient)

	email, err := gmailService.GetProfile(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepository.GetByEmail(ctx, email)
	isNewUser := err != nil
	if isNewUser {
		user, err = h.userRepository.Create(ctx, email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	err = h.oauthRepository.SaveGoogleToken(
		ctx, email, user,
		token.AccessToken, token.RefreshToken,
		token.TokenType, token.Expiry,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if isNewUser {
		syncService := services.NewGmailSyncService(
			gmailService,
			h.transactionRepository,
			h.syncStateRepository,
		)
		if err = syncService.SyncHDFCTransactions(ctx, email, user.ID.String(), nil); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	setCookie(c, "session_user", email, 3600*24*7, true)
	setCookie(c, "is_authenticated", "true", 3600*24*7, false)
	c.Redirect(http.StatusFound, "http://localhost:3000/dashboard")
}

func (h *AuthHandler) Logout(c *gin.Context) {
	setCookie(c, "session_user", "", -1, true)
	setCookie(c, "is_authenticated", "", -1, false)
	c.Redirect(http.StatusFound, "http://localhost:3000/login")
}

func (h *AuthHandler) Me(c *gin.Context) {
	email, err := c.Cookie("session_user")
	if err != nil || email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	ctx := c.Request.Context()
	user, err := h.userRepository.GetByEmail(ctx, email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"email": user.Email})
}
