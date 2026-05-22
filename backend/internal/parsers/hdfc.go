package parsers

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
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

// hdfcIntlCardRegex matches international debit/credit card transaction alert emails.
// Example: "Your HDFC Bank Debit Card ending in XX5899 was used for an international
// purchase of INR 778.30 on 18/05/2026 at PAYPAL *N2EENTERTAI."
var hdfcIntlCardRegex = regexp.MustCompile(
	`Your HDFC Bank (Debit|Credit) Card ending in (?:XX)?(\d{4}) was used for an international purchase of (?:INR|Rs\.?) ([\d,]+\.\d+) on (\d{2}/\d{2}/\d{4}) at ([^.<]+)`,
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

// ParseHDFCInternationalCardTransaction parses HDFC Bank international debit/credit
// card transaction alert emails.
func ParseHDFCInternationalCardTransaction(
	body string,
) (*Transaction, error) {

	match := hdfcIntlCardRegex.FindStringSubmatch(body)

	if len(match) == 0 {
		return nil, fmt.Errorf("international card transaction pattern not found")
	}

	// Strip commas from amount (e.g. "1,234.56" → "1234.56")
	rawAmount := regexp.MustCompile(`,`).ReplaceAllString(match[2], "")
	amount, err := strconv.ParseFloat(rawAmount, 64)
	if err != nil {
		return nil, fmt.Errorf("failed to parse amount %q: %w", match[2], err)
	}

	transactionTime, err := time.Parse("02/01/2006", match[3])
	if err != nil {
		return nil, fmt.Errorf("failed to parse date %q: %w", match[3], err)
	}

	merchant := strings.TrimSpace(match[4])

	transaction := &Transaction{
		Amount:       amount,
		Type:         "debited", // international card alerts are always purchase/debit
		AccountLast4: match[1],
		Merchant:     merchant,
		Name:         merchant,
		OccurredAt:   transactionTime,
	}

	return transaction, nil
}
