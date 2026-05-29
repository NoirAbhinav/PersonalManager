package api

import (
	"net/http"

	"github.com/NoirAbhinav/personalmanager/internal/worker"
	"github.com/gin-gonic/gin"
)

type SyncHandler struct {
	worker *worker.SyncWorker
}

func NewSyncHandler(worker *worker.SyncWorker) *SyncHandler {
	return &SyncHandler{worker: worker}
}

func (h *SyncHandler) SyncGmail(c *gin.Context) {
	email, err := c.Cookie("session_user")
	if err != nil || email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	if !h.worker.Enqueue(email) {
		c.JSON(http.StatusConflict, gin.H{"error": "sync already in progress"})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"status": "syncing"})
}

func (h *SyncHandler) GetSyncStatus(c *gin.Context) {
	email, err := c.Cookie("session_user")
	if err != nil || email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	c.JSON(http.StatusOK, h.worker.GetStatus(email))
}
