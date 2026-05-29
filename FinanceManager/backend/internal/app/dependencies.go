package app

import (
	"github.com/NoirAbhinav/personalmanager/internal/api"
	"github.com/NoirAbhinav/personalmanager/internal/auth"
	"github.com/NoirAbhinav/personalmanager/internal/config"
	"github.com/NoirAbhinav/personalmanager/internal/db"
	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	email "github.com/NoirAbhinav/personalmanager/internal/notifications"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"github.com/NoirAbhinav/personalmanager/internal/scheduler"
	"github.com/NoirAbhinav/personalmanager/internal/scheduler/runners"
	"github.com/NoirAbhinav/personalmanager/internal/services"
	"github.com/NoirAbhinav/personalmanager/internal/worker"
)

type Dependencies struct {
	Config *config.Config

	AuthHandler         *api.AuthHandler
	TransactionHandler  *api.TransactionHandler
	CategoryHandler     *api.CategoryHandler
	SyncHandler         *api.SyncHandler
	SchedulerHandler    *api.SchedulerHandler
	NotificationHandler *api.NotificationHandler

	SyncWorker             *worker.SyncWorker
	SchedulerEngine        *scheduler.Engine
	ScheduledJobRepository *repositories.ScheduledJobRepository
	NotificationRepository *repositories.NotificationRepository
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
		cfg,
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
	// after existing repositories
	scheduledJobRepository := repositories.NewScheduledJobRepository(queries)
	notificationRepository := repositories.NewNotificationRepository(queries)

	// email sender
	emailSender := email.NewSender(
		cfg.SMTPHost,
		cfg.SMTPPort,
		cfg.SMTPUser,
		cfg.SMTPPass,
		cfg.SMTPFrom,
	)

	// scheduler engine
	schedulerEngine := scheduler.NewEngine(scheduledJobRepository, notificationRepository)

	// runners
	syncRunner := runners.NewSyncRunner(
		oauthConfig,
		oauthRepository,
		userRepository,
		transactionRepository,
		syncStateRepository,
		categorizationService,
	)
	digestRunner := runners.NewDigestRunner(transactionRepository, emailSender)
	alertRunner := runners.NewAlertRunner(transactionRepository, notificationRepository, emailSender)

	schedulerEngine.Register("sync", syncRunner)
	schedulerEngine.Register("digest", digestRunner)
	schedulerEngine.Register("alert", alertRunner)
	schedulerHandler := api.NewSchedulerHandler(scheduledJobRepository, userRepository)
	notificationHandler := api.NewNotificationHandler(notificationRepository, userRepository)

	return &Dependencies{
		Config: cfg,

		AuthHandler:        authHandler,
		TransactionHandler: transactionHandler,
		CategoryHandler:    categoryHandler,
		SyncHandler:        syncHandler,

		SyncWorker:             syncWorker,
		SchedulerEngine:        schedulerEngine,
		ScheduledJobRepository: scheduledJobRepository,
		NotificationRepository: notificationRepository,
		SchedulerHandler:       schedulerHandler,
		NotificationHandler:    notificationHandler,
	}, nil
}
