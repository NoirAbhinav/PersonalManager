package services

import (
	"context"
	"log"
	"strconv"

	"github.com/NoirAbhinav/personalmanager/internal/integrations/gmail"
	"github.com/NoirAbhinav/personalmanager/internal/parsers"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
)

type GmailSyncService struct {
	gmailService          *gmail.Service
	transactionRepository *repositories.TransactionRepository
	syncStateRepository   *repositories.SyncStateRepository
}

func NewGmailSyncService(
	gmailService *gmail.Service,
	transactionRepository *repositories.TransactionRepository,
	syncStateRepository *repositories.SyncStateRepository,
) *GmailSyncService {
	return &GmailSyncService{
		gmailService:          gmailService,
		transactionRepository: transactionRepository,
		syncStateRepository:   syncStateRepository,
	}
}

func (s *GmailSyncService) SyncHDFCTransactions(
	ctx context.Context,
	email string,
	onProgress func(current, total int),
) error {
	syncState, err := s.syncStateRepository.GetByEmail(ctx, email)

	// First-time sync — no history ID yet
	if err != nil || !syncState.HistoryID.Valid || syncState.HistoryID.String == "" {
		return s.initialSync(ctx, email, onProgress)
	}

	historyID, err := strconv.ParseUint(syncState.HistoryID.String, 10, 64)
	if err != nil {
		return s.initialSync(ctx, email, onProgress)
	}

	return s.incrementalSync(ctx, email, historyID, onProgress)
}

// initialSync runs on first-ever sync — fetches via search query and saves historyID cursor
func (s *GmailSyncService) initialSync(
	ctx context.Context,
	email string,
	onProgress func(current, total int),
) error {
	emails, newHistoryID, err := s.gmailService.GetInitialHistoryID(
		ctx,
		"from:alerts@hdfcbank.bank.in",
		100,
	)
	if err != nil {
		return err
	}

	if err := s.processEmails(ctx, emails, onProgress); err != nil {
		return err
	}

	return s.syncStateRepository.SaveHistoryID(ctx, email, strconv.FormatUint(newHistoryID, 10))
}

// incrementalSync runs on subsequent syncs — uses History API from last cursor
func (s *GmailSyncService) incrementalSync(
	ctx context.Context,
	email string,
	historyID uint64,
	onProgress func(current, total int),
) error {
	emails, newHistoryID, err := s.gmailService.FetchEmailsSinceHistory(
		ctx,
		historyID,
		"INBOX",
	)
	if err != nil {
		return err
	}

	if len(emails) == 0 {
		return nil // nothing new
	}

	if err := s.processEmails(ctx, emails, onProgress); err != nil {
		return err
	}

	return s.syncStateRepository.SaveHistoryID(ctx, email, strconv.FormatUint(newHistoryID, 10))
}

// processEmails parses and inserts transactions from a slice of emails
func (s *GmailSyncService) processEmails(
	ctx context.Context,
	emails []gmail.Email,
	onProgress func(current, total int),
) error {
	total := len(emails)
	if onProgress != nil {
		onProgress(0, total)
	}

	for i, e := range emails {
		transaction, err := parsers.TryParse(e.HTMLBody, e.ReceivedAt)
		if err != nil {
			log.Printf("failed to parse email %s: %v", e.ID, err)
		} else if transaction != nil {
			if err := s.transactionRepository.Create(ctx, transaction); err != nil {
				log.Printf("failed to insert transaction from email %s: %v", e.ID, err)
			}
		}

		if onProgress != nil {
			onProgress(i+1, total)
		}
	}
	return nil
}
