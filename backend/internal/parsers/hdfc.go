package parsers

import (
	"fmt"
	"regexp"
	"strconv"
	"time"
)

type Transaction struct {
	Amount float64 `json:"amount"`
	Type   string  `json:"type"`

	AccountLast4 string `json:"account_last4"`

	Merchant string `json:"merchant"`
	Name     string `json:"name"`

	ReferenceID string `json:"reference_id"`

	OccurredAt time.Time `json:"occurred_at"`
}

var hdfcTransactionRegex = regexp.MustCompile(
	`Rs\.(\d+\.\d+) is (debited|credited) from your account ending (\d+) towards VPA ([^\s]+) \(([^)]+)\) on (\d{2}-\d{2}-\d{2})`,
)

var referenceRegex = regexp.MustCompile(
	`UPI transaction reference no\.: (\d+)`,
)

func ParseHDFCTransaction(
	body string,
) (*Transaction, error) {

	match := hdfcTransactionRegex.FindStringSubmatch(body)

	if len(match) == 0 {
		return nil, fmt.Errorf("transaction pattern not found")
	}

	amount, err := strconv.ParseFloat(match[1], 64)

	if err != nil {
		return nil, err
	}

	transactionTime, err := time.Parse(
		"02-01-06",
		match[6],
	)

	if err != nil {
		return nil, err
	}

	transaction := &Transaction{
		Amount: amount,
		Type:   match[2],

		AccountLast4: match[3],

		Merchant: match[4],
		Name:     match[5],

		OccurredAt: transactionTime,
	}

	refMatch := referenceRegex.FindStringSubmatch(body)

	if len(refMatch) > 1 {
		transaction.ReferenceID = refMatch[1]
	}

	return transaction, nil
}
