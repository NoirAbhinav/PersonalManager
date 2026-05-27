package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port string

	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	DatabaseURL        string
	GeminiAPIKey       string
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

	cfg := &Config{
		Port:               getEnv("PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", ""),
		GeminiAPIKey:       getEnv("GEMINI_API_KEY", ""),
	}

	return cfg
}
