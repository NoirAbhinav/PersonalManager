package hdfc

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/NoirAbhinav/personalmanager/internal/transactions"
)

var (
	creditedAmountRegex = regexp.MustCompile(
		`Rs\.([\d,]+\.\d+) has been successfully (credited|debited) to your HDFC Bank account ending in (\d+)`,
	)
	creditedSenderRegex = regexp.MustCompile(
		`(?:Sender|Receiver):\s*([^\(]+)\s*\(VPA:\s*([^\)]+)\)`,
	)
	creditedRefRegex = regexp.MustCompile(
		`UPI Reference No\.:\s*(\d+)`,
	)
)

type CreditedParser struct{}

func (CreditedParser) Parse(body string, receivedAt time.Time) (*transactions.Transaction, error) {
	match := creditedAmountRegex.FindStringSubmatch(body)
	if len(match) == 0 {
		return nil, nil
	}

	rawAmount := strings.ReplaceAll(match[1], ",", "")
	amount, err := strconv.ParseFloat(rawAmount, 64)
	if err != nil {
		return nil, fmt.Errorf("hdfc credited: failed to parse amount %q: %w", match[1], err)
	}

	t := &transactions.Transaction{
		Amount:       amount,
		Type:         match[2],
		AccountLast4: match[3],
		OccurredAt:   receivedAt,
	}

	if sender := creditedSenderRegex.FindStringSubmatch(body); len(sender) > 2 {
		t.Name = strings.TrimSpace(sender[1])
		t.Merchant = strings.TrimSpace(sender[2])
	}

	if ref := creditedRefRegex.FindStringSubmatch(body); len(ref) > 1 {
		t.ReferenceID = ref[1]
	}

	return t, nil
}
