package hdfc

import (
	"fmt"
	"regexp"
	"strconv"
	"time"

	"github.com/NoirAbhinav/personalmanager/internal/transactions"
)

var (
	upiRegex = regexp.MustCompile(
		`Rs\.(\d+\.\d+) is (debited|credited) from your account ending (\d+) towards VPA ([^\s]+) \(([^)]+)\) on (\d{2}-\d{2}-\d{2})`,
	)
	upiReferenceRegex = regexp.MustCompile(
		`UPI transaction reference no\.: (\d+)`,
	)
)

type UPIParser struct{}

func (UPIParser) Parse(body string, receivedAt time.Time) (*transactions.Transaction, error) {
	match := upiRegex.FindStringSubmatch(body)
	if len(match) == 0 {
		return nil, nil
	}

	amount, err := strconv.ParseFloat(match[1], 64)
	if err != nil {
		return nil, fmt.Errorf("hdfc upi: failed to parse amount %q: %w", match[1], err)
	}

	t := &transactions.Transaction{
		Amount:       amount,
		Type:         match[2],
		AccountLast4: match[3],
		Merchant:     match[4],
		Name:         match[5],
		OccurredAt:   receivedAt,
	}

	if ref := upiReferenceRegex.FindStringSubmatch(body); len(ref) > 1 {
		t.ReferenceID = ref[1]
	}

	return t, nil
}
