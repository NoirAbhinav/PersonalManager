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

type DigestConfig struct {
	Email  string `json:"email"`
	Period string `json:"period"` // "daily" | "weekly" | "monthly"
}

type DigestRunner struct {
	transactionRepo *repositories.TransactionRepository
	sender          *email.Sender
}

func NewDigestRunner(
	transactionRepo *repositories.TransactionRepository,
	sender *email.Sender,
) *DigestRunner {
	return &DigestRunner{
		transactionRepo: transactionRepo,
		sender:          sender,
	}
}

func (r *DigestRunner) Run(ctx context.Context, job sqlc.ScheduledJob) (string, error) {
	var cfg DigestConfig
	if err := json.Unmarshal(job.JobConfig, &cfg); err != nil {
		return "", fmt.Errorf("invalid digest config: %w", err)
	}
	if cfg.Email == "" {
		return "", fmt.Errorf("digest config missing email")
	}

	userID := job.UserID.String()
	from, to := periodRange(cfg.Period)

	filters := repositories.TransactionFilters{
		From: &from,
		To:   &to,
	}

	// Fetch all transactions in period (up to 500)
	txns, err := r.transactionRepo.GetByUserID(ctx, userID, 500, 0, filters)
	if err != nil {
		return "", fmt.Errorf("failed to fetch transactions: %w", err)
	}

	if len(txns) == 0 {
		return "no transactions in period, skipping email", nil
	}

	subject := fmt.Sprintf("PersonalManager: %s spending digest", strings.Title(cfg.Period))
	body := buildDigestHTML(txns, from, to, cfg.Period)

	if err := r.sender.Send(cfg.Email, subject, body); err != nil {
		return "", fmt.Errorf("failed to send digest email: %w", err)
	}

	return fmt.Sprintf("digest sent to %s (%d transactions)", cfg.Email, len(txns)), nil
}

func periodRange(period string) (time.Time, time.Time) {
	now := time.Now().UTC()
	switch period {
	case "weekly":
		from := now.AddDate(0, 0, -7)
		return from, now
	case "monthly":
		from := now.AddDate(0, -1, 0)
		return from, now
	default: // daily
		from := now.AddDate(0, 0, -1)
		return from, now
	}
}

func buildDigestHTML(txns []sqlc.GetTransactionsByUserIDRow, from, to time.Time, period string) string {
	var totalDebited, totalCredited float64
	var rows strings.Builder

	for _, t := range txns {
		sign := "+"
		color := "#10B981"
		if t.Type == "debited" {
			sign = "-"
			color = "#EF4444"
			totalDebited += t.Amount
		} else {
			totalCredited += t.Amount
		}

		merchant := t.Merchant.String
		if merchant == "" {
			merchant = t.Name.String
		}

		rows.WriteString(fmt.Sprintf(`
		<tr>
			<td style="padding:8px;border-bottom:1px solid #f0f0f0">%s</td>
			<td style="padding:8px;border-bottom:1px solid #f0f0f0">%s</td>
			<td style="padding:8px;border-bottom:1px solid #f0f0f0;color:%s;font-weight:600">%s₹%.2f</td>
		</tr>`, t.OccurredAt.Time.Format("02 Jan"), merchant, color, sign, t.Amount))
	}

	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:#1f2937">%s Spending Digest</h2>
  <p style="color:#6b7280">%s — %s</p>

  <div style="display:flex;gap:16px;margin:24px 0">
    <div style="flex:1;background:#fee2e2;border-radius:8px;padding:16px">
      <p style="margin:0;color:#991b1b;font-size:12px">Total Debited</p>
      <p style="margin:4px 0 0;color:#7f1d1d;font-size:20px;font-weight:700">₹%.2f</p>
    </div>
    <div style="flex:1;background:#dcfce7;border-radius:8px;padding:16px">
      <p style="margin:0;color:#166534;font-size:12px">Total Credited</p>
      <p style="margin:4px 0 0;color:#14532d;font-size:20px;font-weight:700">₹%.2f</p>
    </div>
  </div>

  <table style="width:100%%;border-collapse:collapse">
    <thead>
      <tr style="background:#f9fafb">
        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280">DATE</th>
        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280">MERCHANT</th>
        <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280">AMOUNT</th>
      </tr>
    </thead>
    <tbody>%s</tbody>
  </table>

  <p style="margin-top:32px;color:#9ca3af;font-size:12px">
    Sent by PersonalManager · <a href="#" style="color:#9ca3af">Unsubscribe</a>
  </p>
</body>
</html>`,
		strings.Title(period),
		from.Format("2 Jan 2006"),
		to.Format("2 Jan 2006"),
		totalDebited,
		totalCredited,
		rows.String(),
	)
}
