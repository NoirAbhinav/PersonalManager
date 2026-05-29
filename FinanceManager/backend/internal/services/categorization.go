package services

import (
	"context"
	"log"
	"strings"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
)

// known payment gateways — when merchant matches one of these,
// use the Name field for categorization instead
// resolveMatchTarget is no longer used — we match both merchant and name
// Keeping knownGateways for reference only
var knownGateways = []string{
	"razorpay", "payu", "cashfree", "ccavenue",
	"paytm", "phonepe", "billdesk", "stripe",
	"pinelabs", "ccavenue", "zaakpay",
}

type CategorizationService struct {
	categoryRepository    *repositories.CategoryRepository
	transactionRepository *repositories.TransactionRepository
}

func NewCategorizationService(
	categoryRepository *repositories.CategoryRepository,
	transactionRepository *repositories.TransactionRepository,
) *CategorizationService {
	return &CategorizationService{
		categoryRepository:    categoryRepository,
		transactionRepository: transactionRepository,
	}
}

// CategorizeTransaction assigns a category to a single transaction.
// Returns the matched category ID or empty string if no match.
func (s *CategorizationService) CategorizeTransaction(
	ctx context.Context,
	transaction sqlc.Transaction,
	rules []sqlc.CategoryRule,
) string {
	merchant := strings.ToLower(transaction.Merchant.String)
	name := strings.ToLower(transaction.Name.String)

	for _, rule := range rules {
		keyword := strings.ToLower(rule.Keyword)
		if strings.Contains(merchant, keyword) || strings.Contains(name, keyword) {
			return rule.CategoryID.String()
		}
	}

	return ""
}

// CategorizeAll re-runs categorization rules on all uncategorized transactions
// for a user. Called on sync and on-demand recategorize.
func (s *CategorizationService) CategorizeAll(ctx context.Context, userID string) (int, error) {
	rules, err := s.categoryRepository.GetAllRulesForUser(ctx, userID)
	if err != nil {
		return 0, err
	}
	log.Printf("categorization: loaded %d rules", len(rules))

	uncategorized, err := s.categoryRepository.GetUncategorized(ctx, userID)
	if err != nil {
		return 0, err
	}

	categorized := 0
	for _, t := range uncategorized {
		categoryID := s.CategorizeTransaction(ctx, t, rules)
		if categoryID == "" {
			continue
		}

		if err := s.categoryRepository.SetTransactionCategory(
			ctx,
			t.ID.String(),
			categoryID,
		); err != nil {
			log.Printf("categorization: failed to set category for transaction %s: %v", t.ID, err)
			continue
		}
		categorized++
	}

	log.Printf("categorization: categorized %d/%d transactions for user %s",
		categorized, len(uncategorized), userID)

	return categorized, nil
}

// SetCategory manually overrides a transaction's category
func (s *CategorizationService) SetCategory(
	ctx context.Context,
	transactionID string,
	categoryID string,
) error {
	return s.categoryRepository.SetTransactionCategory(ctx, transactionID, categoryID)
}

// resolveMatchTarget returns the field to match rules against.
// Uses Name when merchant is a known payment gateway, Merchant otherwise.
func (s *CategorizationService) resolveMatchTarget(t sqlc.Transaction) string {
	merchant := strings.ToLower(t.Merchant.String)

	for _, gateway := range knownGateways {
		if strings.Contains(merchant, gateway) {
			return t.Name.String
		}
	}

	return t.Merchant.String
}
