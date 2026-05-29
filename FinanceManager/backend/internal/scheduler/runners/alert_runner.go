package runners

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	email "github.com/NoirAbhinav/personalmanager/internal/notifications"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
)

type AlertCondition struct {
	Field      string  `json:"field"`    // "single_txn_amount" | "category_spend" | "total_spend"
	Operator   string  `json:"operator"` // "gt" | "lt"
	Value      float64 `json:"value"`
	CategoryID string  `json:"category_id,omitempty"`
}

type AlertConfig struct {
	Email      string           `json:"email"`
	Conditions []AlertCondition `json:"conditions"`
}

type AlertRunner struct {
	transactionRepo  *repositories.TransactionRepository
	notificationRepo *repositories.NotificationRepository
	sender           *email.Sender
}

func NewAlertRunner(
	transactionRepo *repositories.TransactionRepository,
	notificationRepo *repositories.NotificationRepository,
	sender *email.Sender,
) *AlertRunner {
	return &AlertRunner{
		transactionRepo:  transactionRepo,
		notificationRepo: notificationRepo,
		sender:           sender,
	}
}

func (r *AlertRunner) Run(ctx context.Context, job sqlc.ScheduledJob) (string, error) {
	var cfg AlertConfig
	if err := json.Unmarshal(job.JobConfig, &cfg); err != nil {
		return "", fmt.Errorf("invalid alert config: %w", err)
	}

	userID := job.UserID.String()

	// Look at transactions since last run (or last 24h if first run)
	since := time.Now().UTC().AddDate(0, 0, -1)
	if job.LastRunAt.Valid {
		since = job.LastRunAt.Time
	}
	now := time.Now().UTC()

	filters := repositories.TransactionFilters{From: &since, To: &now}
	txns, err := r.transactionRepo.GetByUserID(ctx, userID, 500, 0, filters)
	if err != nil {
		return "", fmt.Errorf("failed to fetch transactions: %w", err)
	}

	var triggered []string

	for _, cond := range cfg.Conditions {
		msg := r.evaluate(cond, txns)
		if msg != "" {
			triggered = append(triggered, msg)
		}
	}

	if len(triggered) == 0 {
		return "no alert conditions triggered", nil
	}

	summary := strings.Join(triggered, "; ")

	// Create in-app notification
	jobID := job.ID.String()
	if _, err := r.notificationRepo.Create(ctx, userID, jobID,
		"Spending Alert: "+job.Name, summary); err != nil {
		return "", fmt.Errorf("failed to create notification: %w", err)
	}

	// Send email
	if cfg.Email != "" {
		body := buildAlertHTML(job.Name, triggered, since, now)
		if err := r.sender.Send(cfg.Email, "PersonalManager Alert: "+job.Name, body); err != nil {
			return "", fmt.Errorf("alert notification created but email failed: %w", err)
		}
	}

	return fmt.Sprintf("alert triggered: %s", summary), nil
}

func (r *AlertRunner) evaluate(cond AlertCondition, txns []sqlc.GetTransactionsByUserIDRow) string {
	switch cond.Field {
	case "single_txn_amount":
		for _, t := range txns {
			if compare(t.Amount, cond.Operator, cond.Value) {
				merchant := t.Merchant.String
				if merchant == "" {
					merchant = t.Name.String
				}
				return fmt.Sprintf("transaction of ₹%.2f at %s exceeds threshold ₹%.2f",
					t.Amount, merchant, cond.Value)
			}
		}

	case "total_spend":
		var total float64
		for _, t := range txns {
			if t.Type == "debited" {
				total += t.Amount
			}
		}
		if compare(total, cond.Operator, cond.Value) {
			return fmt.Sprintf("total spend ₹%.2f %s threshold ₹%.2f",
				total, operatorWord(cond.Operator), cond.Value)
		}

	case "category_spend":
		var total float64
		for _, t := range txns {
			if t.Type == "debited" && t.CategoryID.String() == cond.CategoryID {
				total += t.Amount
			}
		}
		if compare(total, cond.Operator, cond.Value) {
			return fmt.Sprintf("category spend ₹%.2f %s threshold ₹%.2f",
				total, operatorWord(cond.Operator), cond.Value)
		}
	}

	return ""
}

func compare(actual float64, operator string, threshold float64) bool {
	switch operator {
	case "gt":
		return actual > threshold
	case "lt":
		return actual < threshold
	}
	return false
}

func operatorWord(op string) string {
	if op == "gt" {
		return "exceeds"
	}
	return "is below"
}

func buildAlertHTML(jobName string, triggered []string, from, to time.Time) string {
	var items strings.Builder
	for _, t := range triggered {
		items.WriteString(fmt.Sprintf(`<li style="margin:8px 0;color:#1f2937">%s</li>`, t))
	}

	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#dc2626">⚠ Spending Alert: %s</h2>
  <p style="color:#6b7280">Period: %s — %s</p>
  <ul style="background:#fef2f2;border-radius:8px;padding:16px 16px 16px 32px">
    %s
  </ul>
  <p style="margin-top:32px;color:#9ca3af;font-size:12px">Sent by PersonalManager</p>
</body>
</html>`,
		jobName,
		from.Format("2 Jan 2006 15:04"),
		to.Format("2 Jan 2006 15:04"),
		items.String(),
	)
}
