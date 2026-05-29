package services

import (
	"context"
	"errors"
	"log"
	"strconv"

	"github.com/NoirAbhinav/personalmanager/internal/integrations/gmail"
	"github.com/NoirAbhinav/personalmanager/internal/parsers"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"google.golang.org/api/googleapi"
)

type GmailSyncService struct {
	gmailService          *gmail.Service
	transactionRepository *repositories.TransactionRepository
	syncStateRepository   *repositories.SyncStateRepository
	categorizationService *CategorizationService // add this

}

func NewGmailSyncService(
	gmailService *gmail.Service,
	transactionRepository *repositories.TransactionRepository,
	syncStateRepository *repositories.SyncStateRepository,
	categorizationService *CategorizationService,
) *GmailSyncService {
	return &GmailSyncService{
		gmailService:          gmailService,
		transactionRepository: transactionRepository,
		syncStateRepository:   syncStateRepository,
		categorizationService: categorizationService,
	}
}

func (s *GmailSyncService) SyncHDFCTransactions(
	ctx context.Context,
	email string,
	userID string,
	onProgress func(current, total int),
) error {
	syncState, err := s.syncStateRepository.GetByEmail(ctx, email)

	if err != nil || !syncState.HistoryID.Valid || syncState.HistoryID.String == "" {
		return s.initialSync(ctx, email, userID, onProgress)
	}

	historyID, err := strconv.ParseUint(syncState.HistoryID.String, 10, 64)
	if err != nil {
		return s.initialSync(ctx, email, userID, onProgress)
	}

	return s.incrementalSync(ctx, email, userID, historyID, onProgress)
}

func (s *GmailSyncService) initialSync(
	ctx context.Context,
	email string,
	userID string,
	onProgress func(current, total int),
) error {
	log.Printf("gmail sync: running initial sync for %s", email)

	emails, newHistoryID, err := s.gmailService.GetInitialHistoryID(
		ctx,
		"from:alerts@hdfcbank.bank.in",
		100,
	)
	if err != nil {
		return err
	}

	if err := s.processEmails(ctx, emails, userID, onProgress); err != nil {
		return err
	}

	return s.syncStateRepository.SaveHistoryID(ctx, email, strconv.FormatUint(newHistoryID, 10))
}

func (s *GmailSyncService) incrementalSync(
	ctx context.Context,
	email string,
	userID string,
	historyID uint64,
	onProgress func(current, total int),
) error {
	log.Printf("gmail sync: running incremental sync for %s from historyID %d", email, historyID)

	emails, newHistoryID, err := s.gmailService.FetchEmailsSinceHistory(
		ctx,
		historyID,
		"INBOX",
	)
	if err != nil {
		// History ID expired — Gmail only retains ~30 days of history
		// Fall back to initial sync to recover
		if isHistoryExpiredError(err) {
			log.Printf("gmail sync: history ID expired for %s, falling back to initial sync", email)
			return s.initialSync(ctx, email, userID, onProgress)
		}
		return err
	}

	if len(emails) == 0 {
		log.Printf("gmail sync: no new emails for %s", email)
		return nil
	}

	if err := s.processEmails(ctx, emails, userID, onProgress); err != nil {
		return err
	}

	return s.syncStateRepository.SaveHistoryID(ctx, email, strconv.FormatUint(newHistoryID, 10))
}

func (s *GmailSyncService) processEmails(
	ctx context.Context,
	emails []gmail.Email,
	userID string,
	onProgress func(current, total int),
) error {
	total := len(emails)
	if onProgress != nil {
		onProgress(0, total)
	}

	for i, e := range emails {
		transaction, err := parsers.TryParse(e.HTMLBody, e.ReceivedAt)
		if err != nil {
			log.Printf("gmail sync: failed to parse email %s: %v", e.ID, err)
		} else if transaction != nil {
			transaction.UserID = userID
			if err := s.transactionRepository.Create(ctx, transaction); err != nil {
				log.Printf("gmail sync: failed to insert transaction from email %s: %v", e.ID, err)
			}
		}

		if onProgress != nil {
			onProgress(i+1, total)
		}
	}

	// Run categorization after all emails are inserted
	// Non-fatal — a categorization failure shouldn't fail the whole sync
	if _, err := s.categorizationService.CategorizeAll(ctx, userID); err != nil {
		log.Printf("gmail sync: categorization failed for %s: %v", userID, err)
	}

	return nil
}

// isHistoryExpiredError returns true when Gmail's History API returns 404
// due to the historyID being older than ~30 days
func isHistoryExpiredError(err error) bool {
	var apiErr *googleapi.Error
	if errors.As(err, &apiErr) {
		return apiErr.Code == 404
	}
	return false
}
