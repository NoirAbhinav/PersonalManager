package hdfc

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/NoirAbhinav/personalmanager/internal/transactions"
)

var internationalCardRegex = regexp.MustCompile(
	`Your HDFC Bank (Debit|Credit) Card ending in (?:XX)?(\d{4}) was used for an international purchase of (?:INR|Rs\.?) ([\d,]+\.\d+) on (\d{2}/\d{2}/\d{4}) at ([^.<]+)`,
)

type InternationalCardParser struct{}

func (InternationalCardParser) Parse(body string, receivedAt time.Time) (*transactions.Transaction, error) {
	match := internationalCardRegex.FindStringSubmatch(body)
	if len(match) == 0 {
		return nil, nil
	}

	rawAmount := strings.ReplaceAll(match[3], ",", "")
	amount, err := strconv.ParseFloat(rawAmount, 64)
	if err != nil {
		return nil, fmt.Errorf("hdfc international: failed to parse amount %q: %w", match[3], err)
	}

	merchant := strings.TrimSpace(match[5])

	return &transactions.Transaction{
		Amount:       amount,
		Type:         "debited",
		AccountLast4: match[2],
		Merchant:     merchant,
		Name:         merchant,
		OccurredAt:   receivedAt,
	}, nil
}
