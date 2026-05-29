package gmail

import (
	"context"
	"encoding/base64"
	"strings"
	"time"

	gmailapi "google.golang.org/api/gmail/v1"
)

type Email struct {
	ID         string    `json:"id"`
	ThreadID   string    `json:"thread_id"`
	From       string    `json:"from"`
	Subject    string    `json:"subject"`
	Snippet    string    `json:"snippet"`
	HTMLBody   string    `json:"html_body"`
	TextBody   string    `json:"text_body"`
	ReceivedAt time.Time `json:"received_at"`
}

type Service struct {
	client *gmailapi.Service
}

func NewService(client *gmailapi.Service) *Service {
	return &Service{client: client}
}

func emailFromMessage(msg *gmailapi.Message) Email {
	email := Email{
		ID:         msg.Id,
		ThreadID:   msg.ThreadId,
		Snippet:    msg.Snippet,
		ReceivedAt: time.UnixMilli(msg.InternalDate).UTC(),
	}
	for _, header := range msg.Payload.Headers {
		switch header.Name {
		case "Subject":
			email.Subject = header.Value
		case "From":
			email.From = header.Value
		}
	}
	extractBodyParts(msg.Payload, &email)
	return email
}

func (s *Service) fetchFullMessage(id string) (*gmailapi.Message, error) {
	return s.client.Users.Messages.Get("me", id).Format("full").Do()
}

func (s *Service) FetchEmails(
	ctx context.Context,
	query string,
	maxResults int64,
) ([]Email, error) {
	resp, err := s.client.Users.Messages.
		List("me").
		Q(query).
		MaxResults(maxResults).
		Do()
	if err != nil {
		return nil, err
	}

	emails := make([]Email, 0, len(resp.Messages))
	for _, msg := range resp.Messages {
		fullMessage, err := s.fetchFullMessage(msg.Id)
		if err != nil {
			continue
		}
		emails = append(emails, emailFromMessage(fullMessage))
	}

	return emails, nil
}

func (s *Service) FetchEmailsSinceHistory(
	ctx context.Context,
	historyID uint64,
	labelFilter string,
) ([]Email, uint64, error) {
	var emails []Email
	var newHistoryID uint64

	err := s.client.Users.History.
		List("me").
		StartHistoryId(historyID).
		HistoryTypes("messageAdded").
		LabelId(labelFilter).
		Pages(ctx, func(resp *gmailapi.ListHistoryResponse) error {
			if resp.HistoryId > newHistoryID {
				newHistoryID = resp.HistoryId
			}
			for _, h := range resp.History {
				for _, ma := range h.MessagesAdded {
					fullMessage, err := s.fetchFullMessage(ma.Message.Id)
					if err != nil {
						continue
					}
					emails = append(emails, emailFromMessage(fullMessage))
				}
			}
			return nil
		})

	if err != nil {
		return nil, 0, err
	}

	return emails, newHistoryID, nil
}

func (s *Service) GetInitialHistoryID(
	ctx context.Context,
	query string,
	maxResults int64,
) ([]Email, uint64, error) {
	resp, err := s.client.Users.Messages.
		List("me").
		Q(query).
		MaxResults(maxResults).
		Do()
	if err != nil {
		return nil, 0, err
	}

	emails := make([]Email, 0, len(resp.Messages))
	for _, msg := range resp.Messages {
		fullMessage, err := s.fetchFullMessage(msg.Id)
		if err != nil {
			continue
		}
		emails = append(emails, emailFromMessage(fullMessage))
	}

	profile, err := s.client.Users.GetProfile("me").Do()
	if err != nil {
		return nil, 0, err
	}

	return emails, uint64(profile.HistoryId), nil
}

func extractBodyParts(part *gmailapi.MessagePart, email *Email) {
	if part == nil {
		return
	}
	switch part.MimeType {
	case "text/plain":
		email.TextBody = decodeBody(part.Body.Data)
	case "text/html":
		email.HTMLBody = decodeBody(part.Body.Data)
	}
	for _, nestedPart := range part.Parts {
		extractBodyParts(nestedPart, email)
	}
}

func decodeBody(data string) string {
	if data == "" {
		return ""
	}
	decoded, err := base64.URLEncoding.DecodeString(data)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(decoded))
}
