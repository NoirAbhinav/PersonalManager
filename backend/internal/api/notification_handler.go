package api

import (
	"net/http"

	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	notifRepo *repositories.NotificationRepository
	userRepo  *repositories.UserRepository
}

func NewNotificationHandler(
	notifRepo *repositories.NotificationRepository,
	userRepo *repositories.UserRepository,
) *NotificationHandler {
	return &NotificationHandler{notifRepo: notifRepo, userRepo: userRepo}
}

func (h *NotificationHandler) userIDFromCookie(c *gin.Context) (string, error) {
	email, err := c.Cookie("session_user")
	if err != nil || email == "" {
		return "", err
	}
	user, err := h.userRepo.GetByEmail(c.Request.Context(), email)
	if err != nil {
		return "", err
	}
	return user.ID.String(), nil
}

func (h *NotificationHandler) List(c *gin.Context) {
	userID, err := h.userIDFromCookie(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	notifs, err := h.notifRepo.GetByUserID(c.Request.Context(), userID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	unread, err := h.notifRepo.GetUnreadCount(c.Request.Context(), userID)
	if err != nil {
		unread = 0
	}

	c.JSON(http.StatusOK, gin.H{
		"notifications": notifs,
		"unread_count":  unread,
	})
}

func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	userID, err := h.userIDFromCookie(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	count, err := h.notifRepo.GetUnreadCount(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}

func (h *NotificationHandler) MarkRead(c *gin.Context) {
	userID, err := h.userIDFromCookie(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	id := c.Param("id")
	if err := h.notifRepo.MarkRead(c.Request.Context(), id, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *NotificationHandler) MarkAllRead(c *gin.Context) {
	userID, err := h.userIDFromCookie(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	if err := h.notifRepo.MarkAllRead(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
