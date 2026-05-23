package worker

import (
	"context"
	"log"
	"sync"

	"github.com/NoirAbhinav/personalmanager/internal/auth"
	gmailintegration "github.com/NoirAbhinav/personalmanager/internal/integrations/gmail"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"github.com/NoirAbhinav/personalmanager/internal/services"
	"golang.org/x/oauth2"
)

type SyncStatus struct {
	Status string `json:"status"` // idle | syncing | completed | failed
	Total  int    `json:"total"`
	Error  string `json:"error,omitempty"`
}

type SyncWorker struct {
	OAuthConfig           *oauth2.Config
	oauthRepository       *repositories.OAuthRepository
	userRepository        *repositories.UserRepository
	transactionRepository *repositories.TransactionRepository
	syncStateRepository   *repositories.SyncStateRepository

	statuses map[string]*SyncStatus
	queue    chan string
	mu       sync.Mutex
}

func NewSyncWorker(
	oauthConfig *oauth2.Config,
	oauthRepository *repositories.OAuthRepository,
	userRepository *repositories.UserRepository,
	transactionRepository *repositories.TransactionRepository,
	syncStateRepository *repositories.SyncStateRepository,
) *SyncWorker {
	return &SyncWorker{
		OAuthConfig:           oauthConfig,
		oauthRepository:       oauthRepository,
		userRepository:        userRepository,
		transactionRepository: transactionRepository,
		syncStateRepository:   syncStateRepository,
		statuses:              make(map[string]*SyncStatus),
		queue:                 make(chan string, 100),
	}
}

// Start processes sync jobs from the queue
func (w *SyncWorker) Start(ctx context.Context) {
	log.Println("sync worker started")
	for {
		select {
		case email := <-w.queue:
			w.process(ctx, email)
		case <-ctx.Done():
			log.Println("sync worker stopped")
			return
		}
	}
}

// Enqueue adds a sync job for the given email, skips if already queued/syncing
func (w *SyncWorker) Enqueue(email string) bool {
	w.mu.Lock()
	defer w.mu.Unlock()

	s, ok := w.statuses[email]
	if ok && s.Status == "syncing" {
		return false // already in progress
	}

	w.statuses[email] = &SyncStatus{Status: "syncing"}
	w.queue <- email
	return true
}

func (w *SyncWorker) GetStatus(email string) SyncStatus {
	w.mu.Lock()
	defer w.mu.Unlock()

	s, ok := w.statuses[email]
	if !ok {
		return SyncStatus{Status: "idle"}
	}
	return *s
}

func (w *SyncWorker) setStatus(email string, s SyncStatus) {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.statuses[email] = &s
}

func (w *SyncWorker) process(ctx context.Context, email string) {
	log.Printf("sync worker: processing %s", email)

	fail := func(err error) {
		log.Printf("sync worker: failed for %s: %v", email, err)
		// Remove UpdateStatus call — just set in-memory status
		w.setStatus(email, SyncStatus{Status: "failed", Error: err.Error()})
	}

	user, err := w.userRepository.GetByEmail(ctx, email)
	if err != nil {
		fail(err)
		return
	}

	integration, err := w.oauthRepository.GetByEmail(ctx, user.ID, email)
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

	freshToken, err := auth.RefreshToken(ctx, w.OAuthConfig, token, user.ID, w.oauthRepository)
	if err != nil {
		fail(err)
		return
	}

	gmailClient, err := gmailintegration.NewClient(ctx, w.OAuthConfig, freshToken)
	if err != nil {
		fail(err)
		return
	}

	gmailService := gmailintegration.NewService(gmailClient)
	syncService := services.NewGmailSyncService(
		gmailService,
		w.transactionRepository,
		w.syncStateRepository,
	)

	var total int
	if err := syncService.SyncHDFCTransactions(ctx, email, user.ID.String(), func(current, t int) {
		total = t
	}); err != nil {
		fail(err)
		return
	}

	w.setStatus(email, SyncStatus{Status: "completed", Total: total})
	log.Printf("sync worker: completed for %s (%d emails)", email, total)
}
