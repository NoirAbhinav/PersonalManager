package repositories

import (
	"context"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/transactions"
	"github.com/jackc/pgx/v5/pgtype"
)

type TransactionFilters struct {
	CategoryID *string
	Type       *string
	From       *time.Time
	To         *time.Time
	MinAmount  *float64
	MaxAmount  *float64
	Search     *string
}

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
	f TransactionFilters,
) ([]sqlc.GetTransactionsByUserIDRow, error) {
	return r.queries.GetTransactionsByUserID(ctx, sqlc.GetTransactionsByUserIDParams{
		UserID:     pgtype.UUID{Bytes: uuidFromString(userID), Valid: true},
		Limit:      limit,
		Offset:     offset,
		CategoryID: optionalUUID(f.CategoryID),
		Type:       optionalText(f.Type),
		From:       optionalTimestamptz(f.From),
		To:         optionalTimestamptz(f.To),
		MinAmount:  optionalFloat8(f.MinAmount),
		MaxAmount:  optionalFloat8(f.MaxAmount),
		Search:     optionalText(f.Search),
	})
}

func (r *TransactionRepository) CountByUserID(
	ctx context.Context,
	userID string,
	f TransactionFilters,
) (int64, error) {
	return r.queries.CountTransactionsByUserID(ctx, sqlc.CountTransactionsByUserIDParams{
		UserID:     pgtype.UUID{Bytes: uuidFromString(userID), Valid: true},
		CategoryID: optionalUUID(f.CategoryID),
		Type:       optionalText(f.Type),
		From:       optionalTimestamptz(f.From),
		To:         optionalTimestamptz(f.To),
		MinAmount:  optionalFloat8(f.MinAmount),
		MaxAmount:  optionalFloat8(f.MaxAmount),
		Search:     optionalText(f.Search),
	})
}

// helpers

func optionalUUID(s *string) pgtype.UUID {
	if s == nil || *s == "" {
		return pgtype.UUID{Valid: false}
	}
	return pgtype.UUID{Bytes: uuidFromString(*s), Valid: true}
}

func optionalText(s *string) pgtype.Text {
	if s == nil || *s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

func optionalTimestamptz(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{Valid: false}
	}
	return pgtype.Timestamptz{Time: *t, Valid: true}
}

func optionalFloat8(f *float64) pgtype.Float8 {
	if f == nil {
		return pgtype.Float8{Valid: false}
	}
	return pgtype.Float8{Float64: *f, Valid: true}
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
