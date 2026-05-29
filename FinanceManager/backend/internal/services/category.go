package services

import (
	"context"
	"fmt"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
)

type CategoryService struct {
	categoryRepository *repositories.CategoryRepository
}

func NewCategoryService(
	categoryRepository *repositories.CategoryRepository,
) *CategoryService {
	return &CategoryService{categoryRepository: categoryRepository}
}

func (s *CategoryService) GetAll(ctx context.Context, userID string) ([]sqlc.Category, error) {
	return s.categoryRepository.GetAll(ctx, userID)
}

func (s *CategoryService) Create(ctx context.Context, userID, name, color string) (sqlc.Category, error) {
	if name == "" {
		return sqlc.Category{}, fmt.Errorf("category name is required")
	}
	if color == "" {
		color = "#6B7280" // default gray
	}
	return s.categoryRepository.Create(ctx, userID, name, color)
}

func (s *CategoryService) Update(ctx context.Context, id, userID, name, color string) (sqlc.Category, error) {
	// Verify ownership before updating
	category, err := s.categoryRepository.GetByID(ctx, id)
	if err != nil {
		return sqlc.Category{}, fmt.Errorf("category not found")
	}
	if category.IsSystem {
		return sqlc.Category{}, fmt.Errorf("cannot edit system categories")
	}
	if category.UserID.String() != userID {
		return sqlc.Category{}, fmt.Errorf("not authorized")
	}

	return s.categoryRepository.Update(ctx, id, name, color)
}

func (s *CategoryService) Delete(ctx context.Context, id, userID string) error {
	category, err := s.categoryRepository.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("category not found")
	}
	if category.IsSystem {
		return fmt.Errorf("cannot delete system categories")
	}
	if category.UserID.String() != userID {
		return fmt.Errorf("not authorized")
	}

	return s.categoryRepository.Delete(ctx, id)
}

func (s *CategoryService) GetRules(ctx context.Context, categoryID string) ([]sqlc.CategoryRule, error) {
	return s.categoryRepository.GetRules(ctx, categoryID)
}

func (s *CategoryService) AddRule(ctx context.Context, categoryID, keyword string) (sqlc.CategoryRule, error) {
	if keyword == "" {
		return sqlc.CategoryRule{}, fmt.Errorf("keyword is required")
	}
	return s.categoryRepository.CreateRule(ctx, categoryID, keyword)
}

func (s *CategoryService) DeleteRule(ctx context.Context, ruleID string) error {
	return s.categoryRepository.DeleteRule(ctx, ruleID)
}
