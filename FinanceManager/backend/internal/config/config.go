package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port   string
	Domain string

	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	DatabaseURL        string
	GeminiAPIKey       string
	FrontendURL        string

	SMTPHost string
	SMTPPort string
	SMTPUser string
	SMTPPass string
	SMTPFrom string
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func Load() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println(".env file not found")
	}

	return &Config{
		Domain:             getEnv("DOMAIN", "finance.abhinavnair.dev"),
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", ""),
		GeminiAPIKey:       getEnv("GEMINI_API_KEY", ""),

		SMTPHost:    getEnv("SMTP_HOST", ""),
		SMTPPort:    getEnv("SMTP_PORT", "587"),
		SMTPUser:    getEnv("SMTP_USER", ""),
		SMTPPass:    getEnv("SMTP_PASS", ""),
		SMTPFrom:    getEnv("SMTP_FROM", ""),
		FrontendURL: getEnv("FRONTEND_URL", "https://finance.abhinavnair.dev"),
	}
}
