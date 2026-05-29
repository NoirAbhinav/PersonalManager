package app

import (
	"net/http"

	"github.com/NoirAbhinav/personalmanager/internal/config"
	"github.com/gin-gonic/gin"
)

func setupRouter(cfg *config.Config, deps *Dependencies) *gin.Engine {
	r := gin.Default()

	setupMiddleware(cfg, r)

	registerRoutes(r, deps)

	return r
}

func registerRoutes(r *gin.Engine, deps *Dependencies) {
	// Health
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	// Auth
	auth := r.Group("/auth")
	{
		auth.GET("/google/login", deps.AuthHandler.GoogleLogin)
		auth.GET("/google/callback", deps.AuthHandler.GoogleCallback)
		auth.GET("/logout", deps.AuthHandler.Logout)
		auth.GET("/me", deps.AuthHandler.Me)
	}

	// Finance API
	finance := r.Group("/finance")
	{
		// Transactions
		finance.GET("/transactions", deps.TransactionHandler.GetTransactions)

		finance.POST("/transactions/:id/category",
			deps.CategoryHandler.SetTransactionCategory,
		)

		finance.POST("/transactions/recategorize",
			deps.CategoryHandler.RecategorizeAll,
		)

		// Categories
		finance.GET("/categories", deps.CategoryHandler.GetCategories)

		finance.POST("/categories", deps.CategoryHandler.CreateCategory)

		finance.PUT("/categories/:id", deps.CategoryHandler.UpdateCategory)

		finance.DELETE("/categories/:id", deps.CategoryHandler.DeleteCategory)

		finance.GET("/categories/:id/rules",
			deps.CategoryHandler.GetRules,
		)

		finance.POST("/categories/:id/rules",
			deps.CategoryHandler.AddRule,
		)

		finance.DELETE("/categories/:id/rules/:rule_id",
			deps.CategoryHandler.DeleteRule,
		)

		// Sync
		finance.POST("/sync/gmail", deps.SyncHandler.SyncGmail)

		finance.GET("/sync/status", deps.SyncHandler.GetSyncStatus)

		// Scheduler
		finance.GET("/scheduler/jobs", deps.SchedulerHandler.ListJobs)
		finance.POST("/scheduler/jobs", deps.SchedulerHandler.CreateJob)
		finance.PUT("/scheduler/jobs/:id", deps.SchedulerHandler.UpdateJob)
		finance.DELETE("/scheduler/jobs/:id", deps.SchedulerHandler.DeleteJob)
		finance.GET("/scheduler/jobs/:id/runs",
			deps.SchedulerHandler.GetJobRuns,
		)

		// Notifications
		finance.GET("/notifications", deps.NotificationHandler.List)

		finance.GET("/notifications/unread-count",
			deps.NotificationHandler.GetUnreadCount,
		)

		finance.POST("/notifications/:id/read",
			deps.NotificationHandler.MarkRead,
		)

		finance.POST("/notifications/read-all",
			deps.NotificationHandler.MarkAllRead,
		)
	}
}
