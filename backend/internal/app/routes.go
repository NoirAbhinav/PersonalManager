package app

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func setupRouter(deps *Dependencies) *gin.Engine {
	r := gin.Default()

	setupMiddleware(r)

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
	r.GET("/auth/google/login", deps.AuthHandler.GoogleLogin)

	r.GET("/auth/google/callback", deps.AuthHandler.GoogleCallback)

	r.GET("/auth/logout", deps.AuthHandler.Logout)

	r.GET("/api/me", deps.AuthHandler.Me)

	// Transactions
	r.GET("/transactions", deps.TransactionHandler.GetTransactions)

	r.POST("/transactions/:id/category",
		deps.CategoryHandler.SetTransactionCategory,
	)

	r.POST("/transactions/recategorize",
		deps.CategoryHandler.RecategorizeAll,
	)

	// Categories
	r.GET("/categories", deps.CategoryHandler.GetCategories)

	r.POST("/categories", deps.CategoryHandler.CreateCategory)

	r.PUT("/categories/:id", deps.CategoryHandler.UpdateCategory)

	r.DELETE("/categories/:id", deps.CategoryHandler.DeleteCategory)

	r.GET("/categories/:id/rules", deps.CategoryHandler.GetRules)

	r.POST("/categories/:id/rules", deps.CategoryHandler.AddRule)

	r.DELETE("/categories/:id/rules/:rule_id",
		deps.CategoryHandler.DeleteRule,
	)

	// Sync
	r.POST("/sync/gmail", deps.SyncHandler.SyncGmail)

	r.GET("/sync/status", deps.SyncHandler.GetSyncStatus)
}
