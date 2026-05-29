package notifications

import (
	"fmt"
	"net/smtp"
	"strings"
)

type Sender struct {
	host string
	port string
	user string
	pass string
	from string
}

func NewSender(host, port, user, pass, from string) *Sender {
	return &Sender{host: host, port: port, user: user, pass: pass, from: from}
}

func (s *Sender) Send(to, subject, htmlBody string) error {
	if s.host == "" {
		return fmt.Errorf("SMTP not configured")
	}

	auth := smtp.PlainAuth("", s.user, s.pass, s.host)

	msg := strings.Join([]string{
		"From: " + s.from,
		"To: " + to,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/html; charset=UTF-8",
		"",
		htmlBody,
	}, "\r\n")

	addr := s.host + ":" + s.port
	return smtp.SendMail(addr, auth, s.from, []string{to}, []byte(msg))
}
