package repositories

import (
	"context"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
)

type UserRepository struct {
	queries *sqlc.Queries
}

func NewUserRepository(q *sqlc.Queries) *UserRepository {
	return &UserRepository{
		queries: q,
	}
}

func (r *UserRepository) GetByEmail(
	ctx context.Context,
	email string,
) (sqlc.User, error) {
	return r.queries.GetUserByEmail(ctx, email)
}

func (r *UserRepository) Create(
	ctx context.Context,
	email string,
) (sqlc.User, error) {
	return r.queries.CreateUser(ctx, email)
}

func (r *UserRepository) GetAll(ctx context.Context) ([]sqlc.User, error) {
	return r.queries.GetAllUsers(ctx)
}
