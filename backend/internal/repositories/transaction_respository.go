package repositories

import (
	"context"
	"encoding/hex"
	"fmt"
	"strings"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/transactions"
	"github.com/jackc/pgx/v5/pgtype"
)

type TransactionRepository struct {
	queries *sqlc.Queries
}

func NewTransactionRepository(queries *sqlc.Queries) *TransactionRepository {
	return &TransactionRepository{queries: queries}
}

func (r *TransactionRepository) Create(
	ctx context.Context,
	transaction *transactions.Transaction,
) error {
	return r.queries.CreateTransaction(ctx, sqlc.CreateTransactionParams{
		UserID:       pgtype.UUID{Bytes: uuidFromString(transaction.UserID), Valid: transaction.UserID != ""},
		Amount:       transaction.Amount,
		Type:         transaction.Type,
		AccountLast4: pgtype.Text{String: transaction.AccountLast4, Valid: transaction.AccountLast4 != ""},
		Merchant:     pgtype.Text{String: transaction.Merchant, Valid: transaction.Merchant != ""},
		Name:         pgtype.Text{String: transaction.Name, Valid: transaction.Name != ""},
		ReferenceID:  pgtype.Text{String: transaction.ReferenceID, Valid: transaction.ReferenceID != ""},
		OccurredAt:   pgtype.Timestamp{Time: transaction.OccurredAt, Valid: true},
	})
}

func (r *TransactionRepository) GetByUserID(
	ctx context.Context,
	userID string,
	limit int32,
	offset int32,
) ([]sqlc.Transaction, error) {
	return r.queries.GetTransactionsByUserID(ctx, sqlc.GetTransactionsByUserIDParams{
		UserID: pgtype.UUID{Bytes: uuidFromString(userID), Valid: true},
		Limit:  limit,
		Offset: offset,
	})
}

func (r *TransactionRepository) CountByUserID(
	ctx context.Context,
	userID string,
) (int64, error) {
	return r.queries.CountTransactionsByUserID(ctx, pgtype.UUID{
		Bytes: uuidFromString(userID),
		Valid: true,
	})
}

func uuidFromString(s string) [16]byte {
	var b [16]byte
	parsed, err := parseUUID(s)
	if err != nil {
		return b
	}
	return parsed
}

func parseUUID(s string) ([16]byte, error) {
	var uuid [16]byte
	s = strings.ReplaceAll(s, "-", "")
	if len(s) != 32 {
		return uuid, fmt.Errorf("invalid UUID length")
	}
	b, err := hex.DecodeString(s)
	if err != nil {
		return uuid, err
	}
	copy(uuid[:], b)
	return uuid, nil
}
