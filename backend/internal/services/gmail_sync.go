package services

import (
	"context"
	"log"

	"github.com/NoirAbhinav/personalmanager/internal/integrations/gmail"
	"github.com/NoirAbhinav/personalmanager/internal/parsers"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
)

type GmailSyncService struct {
	gmailService *gmail.Service

	transactionRepository *repositories.TransactionRepository
}

func NewGmailSyncService(
	gmailService *gmail.Service,
	transactionRepository *repositories.TransactionRepository,
) *GmailSyncService {

	return &GmailSyncService{
		gmailService:          gmailService,
		transactionRepository: transactionRepository,
	}
}

func (s *GmailSyncService) SyncHDFCTransactions(
	ctx context.Context,
) error {

	emails, err := s.gmailService.FetchEmails(
		ctx,
		"from:alerts@hdfcbank.bank.in",
		100,
	)

	if err != nil {
		return err
	}

	for _, email := range emails {

		transaction, err := parsers.ParseHDFCTransaction(
			email.HTMLBody,
		)

		if err != nil {
			continue
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
