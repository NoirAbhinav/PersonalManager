package repositories

import (
	"context"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type CategoryRepository struct {
	queries *sqlc.Queries
}

func NewCategoryRepository(queries *sqlc.Queries) *CategoryRepository {
	return &CategoryRepository{queries: queries}
}

func (r *CategoryRepository) GetAll(ctx context.Context, userID string) ([]sqlc.Category, error) {
	return r.queries.GetAllCategories(ctx, pgtype.UUID{
		Bytes: uuidFromString(userID),
		Valid: true,
	})
}

func (r *CategoryRepository) GetByID(ctx context.Context, id string) (sqlc.Category, error) {
	return r.queries.GetCategoryByID(ctx, pgtype.UUID{
		Bytes: uuidFromString(id),
		Valid: true,
	})
}

func (r *CategoryRepository) Create(ctx context.Context, userID, name, color string) (sqlc.Category, error) {
	return r.queries.CreateCategory(ctx, sqlc.CreateCategoryParams{
		UserID: pgtype.UUID{Bytes: uuidFromString(userID), Valid: true},
		Name:   name,
		Color:  color,
	})
}

func (r *CategoryRepository) Update(ctx context.Context, id, name, color string) (sqlc.Category, error) {
	return r.queries.UpdateCategory(ctx, sqlc.UpdateCategoryParams{
		ID:    pgtype.UUID{Bytes: uuidFromString(id), Valid: true},
		Name:  name,
		Color: color,
	})
}

func (r *CategoryRepository) Delete(ctx context.Context, id string) error {
	return r.queries.DeleteCategory(ctx, pgtype.UUID{
		Bytes: uuidFromString(id),
		Valid: true,
	})
}

func (r *CategoryRepository) GetRules(ctx context.Context, categoryID string) ([]sqlc.CategoryRule, error) {
	return r.queries.GetCategoryRules(ctx, pgtype.UUID{
		Bytes: uuidFromString(categoryID),
		Valid: true,
	})
}

func (r *CategoryRepository) GetAllRulesForUser(ctx context.Context, userID string) ([]sqlc.CategoryRule, error) {
	return r.queries.GetAllRulesForUser(ctx, pgtype.UUID{
		Bytes: uuidFromString(userID),
		Valid: true,
	})
}

func (r *CategoryRepository) CreateRule(ctx context.Context, categoryID, keyword string) (sqlc.CategoryRule, error) {
	return r.queries.CreateCategoryRule(ctx, sqlc.CreateCategoryRuleParams{
		CategoryID: pgtype.UUID{Bytes: uuidFromString(categoryID), Valid: true},
		Keyword:    keyword,
	})
}

func (r *CategoryRepository) DeleteRule(ctx context.Context, ruleID string) error {
	return r.queries.DeleteCategoryRule(ctx, pgtype.UUID{
		Bytes: uuidFromString(ruleID),
		Valid: true,
	})
}

func (r *CategoryRepository) SetTransactionCategory(ctx context.Context, transactionID, categoryID string) error {
	return r.queries.SetTransactionCategory(ctx, sqlc.SetTransactionCategoryParams{
		ID:         pgtype.UUID{Bytes: uuidFromString(transactionID), Valid: true},
		CategoryID: pgtype.UUID{Bytes: uuidFromString(categoryID), Valid: true},
	})
}

func (r *CategoryRepository) GetUncategorized(ctx context.Context, userID string) ([]sqlc.Transaction, error) {
	return r.queries.GetUncategorizedTransactions(ctx, pgtype.UUID{
		Bytes: uuidFromString(userID),
		Valid: true,
	})
}
