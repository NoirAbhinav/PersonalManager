package repositories

import (
	"context"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/transactions"
	"github.com/jackc/pgx/v5/pgtype"
)

type TransactionRepository struct {
	queries *sqlc.Queries
}

func NewTransactionRepository(
	queries *sqlc.Queries,
) *TransactionRepository {

	return &TransactionRepository{
		queries: queries,
	}
}

func (r *TransactionRepository) Create(
	ctx context.Context,
	transaction *transactions.Transaction,
) error {

	err := r.queries.CreateTransaction(
		ctx,
		sqlc.CreateTransactionParams{
			Amount: transaction.Amount,

			Type: transaction.Type,

			AccountLast4: pgtype.Text{
				String: transaction.AccountLast4,
				Valid:  transaction.AccountLast4 != "",
			},

			Merchant: pgtype.Text{
				String: transaction.Merchant,
				Valid:  transaction.Merchant != "",
			},

			Name: pgtype.Text{
				String: transaction.Name,
				Valid:  transaction.Name != "",
			},

			ReferenceID: pgtype.Text{
				String: transaction.ReferenceID,
				Valid:  transaction.ReferenceID != "",
			},

			OccurredAt: pgtype.Timestamp{
				Time:  transaction.OccurredAt,
				Valid: true,
			},
		},
	)

	if err != nil {

		return err
	}

	return nil
}

func (r *TransactionRepository) GetAll(
	ctx context.Context,
) ([]sqlc.Transaction, error) {

	return r.queries.GetTransactions(ctx)
}
