package gmail

import (
	"context"
	"encoding/base64"
	"strings"

	gmailapi "google.golang.org/api/gmail/v1"
)

type Email struct {
	ID       string `json:"id"`
	ThreadID string `json:"thread_id"`

	From    string `json:"from"`
	Subject string `json:"subject"`

	Snippet string `json:"snippet"`

	HTMLBody string `json:"html_body"`
	TextBody string `json:"text_body"`
}

type Service struct {
	client *gmailapi.Service
}

func NewService(
	client *gmailapi.Service,
) *Service {

	return &Service{
		client: client,
	}
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

	emails := make([]Email, 0)

	for _, msg := range resp.Messages {

		fullMessage, err := s.client.Users.Messages.
			Get("me", msg.Id).
			Format("full").
			Do()

		if err != nil {
			continue
		}

		email := Email{
			ID:       fullMessage.Id,
			ThreadID: fullMessage.ThreadId,
			Snippet:  fullMessage.Snippet,
		}

		// Extract headers
		for _, header := range fullMessage.Payload.Headers {

			switch header.Name {

			case "Subject":
				email.Subject = header.Value

			case "From":
				email.From = header.Value
			}
		}

		// Extract email bodies
		extractBodyParts(fullMessage.Payload, &email)

		emails = append(emails, email)
	}

	return emails, nil
}

func extractBodyParts(
	part *gmailapi.MessagePart,
	email *Email,
) {

	if part == nil {
		return
	}

	switch part.MimeType {

	case "text/plain":

		email.TextBody = decodeBody(part.Body.Data)

	case "text/html":

		email.HTMLBody = decodeBody(part.Body.Data)
	}

	// Recursively process nested MIME parts
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
