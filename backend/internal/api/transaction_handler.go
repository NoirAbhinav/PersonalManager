package api

import (
	"net/http"

	"github.com/NoirAbhinav/personalmanager/internal/services"

	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	transactionService *services.TransactionService
}

func NewTransactionHandler(
	transactionService *services.TransactionService,
) *TransactionHandler {

	return &TransactionHandler{
		transactionService: transactionService,
	}
}

func (h *TransactionHandler) GetTransactions(
	c *gin.Context,
) {

	transactions, err := h.transactionService.GetTransactions(
		c.Request.Context(),
	)

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"transactions": transactions,
	})
}
