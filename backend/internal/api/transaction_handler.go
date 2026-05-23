package api

import (
	"net/http"
	"strconv"

	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"github.com/NoirAbhinav/personalmanager/internal/services"
	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	transactionService *services.TransactionService
	userRepository     *repositories.UserRepository
}

func NewTransactionHandler(
	transactionService *services.TransactionService,
	userRepository *repositories.UserRepository,
) *TransactionHandler {
	return &TransactionHandler{
		transactionService: transactionService,
		userRepository:     userRepository,
	}
}

func (h *TransactionHandler) GetTransactions(c *gin.Context) {
	email, err := c.Cookie("session_user")
	if err != nil || email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	ctx := c.Request.Context()

	user, err := h.userRepository.GetByEmail(ctx, email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	page := int32(1)
	pageSize := int32(services.DefaultPageSize)

	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil {
			page = int32(parsed)
		}
	}
	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil {
			pageSize = int32(parsed)
		}
	}

	result, err := h.transactionService.GetTransactions(ctx, user.ID.String(), page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}
