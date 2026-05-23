package parsers

import (
	"time"

	"github.com/NoirAbhinav/personalmanager/internal/transactions"
)

type Parser interface {
	Parse(body string, receivedAt time.Time) (*transactions.Transaction, error)
}
