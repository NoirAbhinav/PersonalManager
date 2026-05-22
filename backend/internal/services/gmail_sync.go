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
	onProgress func(current, total int),
) error {
	syncState, _ := s.syncStateRepository.GetByEmail(ctx, email)

	var lastMessageID string
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

	// Filter already-synced emails first so total is accurate upfront
	var pending []gmail.Email
	for _, e := range emails {
		if e.ID == lastMessageID {
			break
		}
		pending = append(pending, e)
	}

	total := len(pending)
	if onProgress != nil {
		onProgress(0, total)
	}

	for i, e := range pending {
		transaction, err := parsers.ParseHDFCTransaction(e.HTMLBody)
		if err != nil {
			transaction, err = parsers.ParseHDFCInternationalCardTransaction(e.HTMLBody)
		}

		if err == nil {
			if err := s.transactionRepository.Create(ctx, transaction); err != nil {
				log.Println(err)
			}
		}

		if onProgress != nil {
			onProgress(i+1, total)
		}
	}

	return nil
}
