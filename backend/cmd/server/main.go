package main

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"github.com/NoirAbhinav/personalmanager/internal/api"
	"github.com/NoirAbhinav/personalmanager/internal/auth"
	"github.com/NoirAbhinav/personalmanager/internal/config"
	"github.com/NoirAbhinav/personalmanager/internal/db"
	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"github.com/NoirAbhinav/personalmanager/internal/services"
)

func main() {

	// Load config
	cfg := config.Load()

	// Initialize postgres
	postgresDB, err := db.NewPostgres(
		cfg.DatabaseURL,
	)

	if err != nil {
		log.Fatal(err)
	}

	// Initialize sqlc queries
	queries := sqlc.New(postgresDB)

	// Initialize repositories
	transactionRepository := repositories.NewTransactionRepository(
		queries,
	)
	oathRepository := repositories.NewOAuthRepository(
		queries,
	)
	syncStateRepository := repositories.NewSyncStateRepository(
		queries,
	)

	// Initialize services
	transactionService := services.NewTransactionService(
		transactionRepository,
	)

	userRepository := repositories.NewUserRepository(
		queries,
	)

	// OAuth config
	oauthConfig := auth.NewGoogleOAuthConfig(cfg)

	// Initialize handlers
	authHandler := api.NewAuthHandler(
		oauthConfig,
		transactionRepository,
		oathRepository,
		syncStateRepository,
		userRepository,
	)

	transactionHandler := api.NewTransactionHandler(
		transactionService,
	)

	syncHandler := api.NewSyncHandler(
		oauthConfig,

		oathRepository,
		userRepository,

		transactionRepository,
		syncStateRepository,
	)
	// Setup router
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	// Auth routes
	r.GET(
		"/auth/google/login",
		authHandler.GoogleLogin,
	)

	r.GET(
		"/auth/google/callback",
		authHandler.GoogleCallback,
	)

	// Transaction routes
	r.GET(
		"/transactions",
		transactionHandler.GetTransactions,
	)

	r.POST(
		"/sync/gmail",
		syncHandler.SyncGmail,
	)

	// Start server
	log.Printf("server running on port %s", cfg.Port)

	err = r.Run(":" + cfg.Port)

	if err != nil {
		log.Fatal(err)
	}

}
