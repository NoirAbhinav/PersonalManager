// internal/transactions/transaction.go
package transactions

import "time"

type Transaction struct {
	UserID       string    `json:"user_id"`
	Amount       float64   `json:"amount"`
	Type         string    `json:"type"`
	AccountLast4 string    `json:"account_last4"`
	Merchant     string    `json:"merchant"`
	Name         string    `json:"name"`
	ReferenceID  string    `json:"reference_id"`
	OccurredAt   time.Time `json:"occurred_at"`
}
