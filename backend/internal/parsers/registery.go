package parsers

import (
	"time"

	"github.com/NoirAbhinav/personalmanager/internal/parsers/banks/hdfc"
	"github.com/NoirAbhinav/personalmanager/internal/transactions"
)

var registry = []Parser{
	hdfc.UPIParser{},
	hdfc.CreditedParser{},
	hdfc.InternationalCardParser{},
	// icici.UPIParser{},
}

func TryParse(body string, receivedAt time.Time) (*transactions.Transaction, error) {
	for _, p := range registry {
		t, err := p.Parse(body, receivedAt)
		if err != nil {
			return nil, err
		}
		if t != nil {
			return t, nil
		}
	}
	return nil, nil
}
