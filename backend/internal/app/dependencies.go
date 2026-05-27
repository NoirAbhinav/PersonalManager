package app

import (
	"github.com/NoirAbhinav/personalmanager/internal/api"
	"github.com/NoirAbhinav/personalmanager/internal/auth"
	"github.com/NoirAbhinav/personalmanager/internal/config"
	"github.com/NoirAbhinav/personalmanager/internal/db"
	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"github.com/NoirAbhinav/personalmanager/internal/services"
	"github.com/NoirAbhinav/personalmanager/internal/worker"
)

type Dependencies struct {
	Config *config.Config

	AuthHandler        *api.AuthHandler
	TransactionHandler *api.TransactionHandler
	CategoryHandler    *api.CategoryHandler
	SyncHandler        *api.SyncHandler

	SyncWorker *worker.SyncWorker
}

func loadConfig() *config.Config {
	return config.Load()
}

func buildDependencies(cfg *config.Config) (*Dependencies, error) {

	// Database
	postgresDB, err := db.NewPostgres(cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}

	queries := sqlc.New(postgresDB)

	// Repositories
	transactionRepository := repositories.NewTransactionRepository(queries)

	oauthRepository := repositories.NewOAuthRepository(queries)

	syncStateRepository := repositories.NewSyncStateRepository(queries)

	userRepository := repositories.NewUserRepository(queries)

	categoryRepository := repositories.NewCategoryRepository(queries)

	// Services
	transactionService := services.NewTransactionService(
		transactionRepository,
	)

	categoryService := services.NewCategoryService(
		categoryRepository,
	)

	categorizationService := services.NewCategorizationService(
		categoryRepository,
		transactionRepository,
	)

	// OAuth
	oauthConfig := auth.NewGoogleOAuthConfig(cfg)

	// Handlers
	authHandler := api.NewAuthHandler(
		oauthConfig,
		transactionRepository,
		oauthRepository,
		syncStateRepository,
		userRepository,
		categorizationService,
	)

	transactionHandler := api.NewTransactionHandler(
		transactionService,
		userRepository,
	)

	categoryHandler := api.NewCategoryHandler(
		categoryService,
		categorizationService,
		userRepository,
	)

	// Workers
	syncWorker := worker.NewSyncWorker(
		oauthConfig,
		oauthRepository,
		userRepository,
		transactionRepository,
		syncStateRepository,
		categorizationService,
	)

	syncHandler := api.NewSyncHandler(
		syncWorker,
	)

	return &Dependencies{
		Config: cfg,

		AuthHandler:        authHandler,
		TransactionHandler: transactionHandler,
		CategoryHandler:    categoryHandler,
		SyncHandler:        syncHandler,

		SyncWorker: syncWorker,
	}, nil
}
