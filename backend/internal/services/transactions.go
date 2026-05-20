package services

import (
	"context"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
)

type TransactionService struct {
	transactionRepository *repositories.TransactionRepository
}

func NewTransactionService(
	transactionRepository *repositories.TransactionRepository,
) *TransactionService {

	return &TransactionService{
		transactionRepository: transactionRepository,
	}
}

func (s *TransactionService) GetTransactions(
	ctx context.Context,
) ([]sqlc.Transaction, error) {

	return s.transactionRepository.GetAll(ctx)
}
