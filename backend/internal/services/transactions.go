package services

import (
	"context"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
)

const DefaultPageSize = 20

type TransactionService struct {
	transactionRepository *repositories.TransactionRepository
}

func NewTransactionService(
	transactionRepository *repositories.TransactionRepository,
) *TransactionService {
	return &TransactionService{transactionRepository: transactionRepository}
}

type TransactionsResult struct {
	Transactions []sqlc.GetTransactionsByUserIDRow `json:"transactions"`
	Total        int64                             `json:"total"`
	Page         int32                             `json:"page"`
	PageSize     int32                             `json:"page_size"`
	TotalPages   int32                             `json:"total_pages"`
}

func (s *TransactionService) GetTransactions(
	ctx context.Context,
	userID string,
	page int32,
	pageSize int32,
	filters repositories.TransactionFilters,
) (*TransactionsResult, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = DefaultPageSize
	}

	offset := (page - 1) * pageSize

	txns, err := s.transactionRepository.GetByUserID(ctx, userID, pageSize, offset, filters)
	if err != nil {
		return nil, err
	}

	total, err := s.transactionRepository.CountByUserID(ctx, userID, filters)
	if err != nil {
		return nil, err
	}

	totalPages := int32((total + int64(pageSize) - 1) / int64(pageSize))

	return &TransactionsResult{
		Transactions: txns,
		Total:        total,
		Page:         page,
		PageSize:     pageSize,
		TotalPages:   totalPages,
	}, nil
}
