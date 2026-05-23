package main

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"github.com/NoirAbhinav/personalmanager/internal/api"
	"github.com/NoirAbhinav/personalmanager/internal/auth"
	"github.com/NoirAbhinav/personalmanager/internal/config"
	"github.com/NoirAbhinav/personalmanager/internal/db"
	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"github.com/NoirAbhinav/personalmanager/internal/services"
	"github.com/NoirAbhinav/personalmanager/internal/worker"
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

	syncWorker := worker.NewSyncWorker(
		oauthConfig,
		oathRepository,
		userRepository,
		transactionRepository,
		syncStateRepository,
	)

	syncHandler := api.NewSyncHandler(
		syncWorker,
	)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go syncWorker.Start(ctx)

	// Setup router
	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length", "Location"}, // added Location
		AllowCredentials: true,
		MaxAge:           86400,
	}))

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

	r.GET("/api/me", authHandler.Me)

	r.GET("/auth/logout", authHandler.Logout)

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

	r.GET("/sync/status", syncHandler.GetSyncStatus)

	// Start server
	log.Printf("server running on port %s", cfg.Port)

	err = r.Run(":" + cfg.Port)

	if err != nil {
		log.Fatal(err)
	}

}
