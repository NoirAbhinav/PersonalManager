package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/NoirAbhinav/personalmanager/internal/integrations/gmail"
	"github.com/NoirAbhinav/personalmanager/internal/parsers"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
)

type GmailSyncService struct {
	gmailService *gmail.Service

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

func buildHDFCQuery(
	lastSyncedAt *time.Time,
) string {

	baseQuery := "from:alerts@hdfcbank.bank.in"

	if lastSyncedAt == nil {
		return baseQuery
	}

	after := lastSyncedAt.Format("2006/01/02")

	return fmt.Sprintf(
		"%s after:%s",
		baseQuery,
		after,
	)
}

func (s *GmailSyncService) SyncHDFCTransactions(
	ctx context.Context,
	email string,
) error {
	var lastMessageID string
	syncState, err := s.syncStateRepository.GetByEmail(
		ctx,
		email,
	)

	if syncState.LastMessageID.Valid {
		lastMessageID = syncState.LastMessageID.String
	}

	emails, err := s.gmailService.FetchEmails(
		ctx,
		"from:alerts@hdfcbank.bank.in newer_than:30d",
		100,
	)

	if err != nil {
		return err
	}

	for _, email := range emails {

		// Try parsing as UPI/VPA transaction first
		transaction, err := parsers.ParseHDFCTransaction(
			email.HTMLBody,
		)

		// If UPI parsing fails, try international card transaction parsing
		if err != nil {
			transaction, err = parsers.ParseHDFCInternationalCardTransaction(
				email.HTMLBody,
			)
		}

		// Skip if both parsers fail
		if err != nil {
			continue
		}

		if email.ID == lastMessageID {
			break
		}

		err = s.transactionRepository.Create(
			ctx,
			transaction,
		)

		if err != nil {
			log.Println(err)
		}
	}

	return nil
}
