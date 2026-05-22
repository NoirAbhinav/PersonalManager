package api

import (
	"context"
	"log"
	"net/http"
	"sync"

	"github.com/NoirAbhinav/personalmanager/internal/auth"
	gmailintegration "github.com/NoirAbhinav/personalmanager/internal/integrations/gmail"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"github.com/NoirAbhinav/personalmanager/internal/services"
	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
)

type SyncProgress struct {
	Status  string `json:"status"` // idle | syncing | completed | failed
	Current int    `json:"progress_current"`
	Total   int    `json:"progress_total"`
	Error   string `json:"error,omitempty"`
}

type SyncHandler struct {
	OAuthConfig           *oauth2.Config
	oauthRepository       *repositories.OAuthRepository
	userRepository        *repositories.UserRepository
	transactionRepository *repositories.TransactionRepository
	syncStateRepository   *repositories.SyncStateRepository

	progress map[string]*SyncProgress
	mu       sync.Mutex
}

func NewSyncHandler(
	oauthConfig *oauth2.Config,
	oauthRepository *repositories.OAuthRepository,
	userRepository *repositories.UserRepository,
	transactionRepository *repositories.TransactionRepository,
	syncStateRepository *repositories.SyncStateRepository,
) *SyncHandler {
	return &SyncHandler{
		OAuthConfig:           oauthConfig,
		oauthRepository:       oauthRepository,
		userRepository:        userRepository,
		transactionRepository: transactionRepository,
		syncStateRepository:   syncStateRepository,
		progress:              make(map[string]*SyncProgress),
	}
}

func (h *SyncHandler) getProgress(email string) *SyncProgress {
	h.mu.Lock()
	defer h.mu.Unlock()
	p, ok := h.progress[email]
	if !ok {
		return &SyncProgress{Status: "idle"}
	}
	return p
}

func (h *SyncHandler) setProgress(email string, p SyncProgress) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.progress[email] = &p
}

func (h *SyncHandler) SyncGmail(c *gin.Context) {
	email, err := c.Cookie("session_user")
	if err != nil || email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	// Prevent duplicate syncs
	p := h.getProgress(email)
	if p.Status == "syncing" {
		c.JSON(http.StatusConflict, gin.H{"error": "sync already in progress"})
		return
	}

	h.setProgress(email, SyncProgress{Status: "syncing", Current: 0, Total: 0})
	c.JSON(http.StatusAccepted, gin.H{"status": "syncing"})

	go func() {
		bgCtx := context.Background()

		fail := func(err error) {
			log.Printf("sync: failed for %s: %v", email, err)
			h.setProgress(email, SyncProgress{Status: "failed", Error: err.Error()})
		}

		user, err := h.userRepository.GetByEmail(bgCtx, email)
		if err != nil {
			fail(err)
			return
		}

		integration, err := h.oauthRepository.GetByEmail(bgCtx, user.ID, email)
		if err != nil {
			fail(err)
			return
		}

		token := &oauth2.Token{
			AccessToken:  integration.AccessToken,
			RefreshToken: integration.RefreshToken,
			TokenType:    integration.TokenType.String,
			Expiry:       integration.Expiry.Time,
		}

		freshToken, err := auth.RefreshToken(bgCtx, h.OAuthConfig, token, user.ID, h.oauthRepository)
		if err != nil {
			fail(err)
			return
		}

		gmailClient, err := gmailintegration.NewClient(bgCtx, h.OAuthConfig, freshToken)
		if err != nil {
			fail(err)
			return
		}

		gmailService := gmailintegration.NewService(gmailClient)
		syncService := services.NewGmailSyncService(
			gmailService,
			h.transactionRepository,
			h.syncStateRepository,
		)

		if err := syncService.SyncHDFCTransactions(bgCtx, email, func(current, total int) {
			h.setProgress(email, SyncProgress{
				Status:  "syncing",
				Current: current,
				Total:   total,
			})
		}); err != nil {
			fail(err)
			return
		}

		// Get final counts for the completed state
		final := h.getProgress(email)
		h.setProgress(email, SyncProgress{
			Status:  "completed",
			Current: final.Current,
			Total:   final.Total,
		})
		log.Printf("sync: completed for %s (%d emails)", email, final.Total)
	}()
}

func (h *SyncHandler) GetSyncStatus(c *gin.Context) {
	email, err := c.Cookie("session_user")
	if err != nil || email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	c.JSON(http.StatusOK, h.getProgress(email))
}
