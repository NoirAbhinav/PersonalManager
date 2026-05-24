package api

import (
	"net/http"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"github.com/NoirAbhinav/personalmanager/internal/services"
	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	categoryService       *services.CategoryService
	categorizationService *services.CategorizationService
	userRepository        *repositories.UserRepository
}

func NewCategoryHandler(
	categoryService *services.CategoryService,
	categorizationService *services.CategorizationService,
	userRepository *repositories.UserRepository,
) *CategoryHandler {
	return &CategoryHandler{
		categoryService:       categoryService,
		categorizationService: categorizationService,
		userRepository:        userRepository,
	}
}

func (h *CategoryHandler) resolveUser(c *gin.Context) (string, bool) {
	email, err := c.Cookie("session_user")
	if err != nil || email == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return "", false
	}
	user, err := h.userRepository.GetByEmail(c.Request.Context(), email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return "", false
	}
	return user.ID.String(), true
}

func (h *CategoryHandler) GetCategories(c *gin.Context) {
	userID, ok := h.resolveUser(c)
	if !ok {
		return
	}

	categories, err := h.categoryService.GetAll(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"categories": categories})
}

func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	userID, ok := h.resolveUser(c)
	if !ok {
		return
	}

	var body struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	category, err := h.categoryService.Create(c.Request.Context(), userID, body.Name, body.Color)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, category)
}

func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	userID, ok := h.resolveUser(c)
	if !ok {
		return
	}

	var body struct {
		Name  string `json:"name"`
		Color string `json:"color"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	category, err := h.categoryService.Update(
		c.Request.Context(),
		c.Param("id"),
		userID,
		body.Name,
		body.Color,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, category)
}

func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	userID, ok := h.resolveUser(c)
	if !ok {
		return
	}

	if err := h.categoryService.Delete(c.Request.Context(), c.Param("id"), userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

func (h *CategoryHandler) GetRules(c *gin.Context) {
	_, ok := h.resolveUser(c)
	if !ok {
		return
	}

	rules, err := h.categoryService.GetRules(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// Return empty array instead of null when no rules exist
	if rules == nil {
		rules = []sqlc.CategoryRule{}
	}

	c.JSON(http.StatusOK, gin.H{"rules": rules})
}

func (h *CategoryHandler) AddRule(c *gin.Context) {
	_, ok := h.resolveUser(c)
	if !ok {
		return
	}

	var body struct {
		Keyword string `json:"keyword"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	rule, err := h.categoryService.AddRule(c.Request.Context(), c.Param("id"), body.Keyword)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, rule)
}

func (h *CategoryHandler) DeleteRule(c *gin.Context) {
	_, ok := h.resolveUser(c)
	if !ok {
		return
	}

	if err := h.categoryService.DeleteRule(c.Request.Context(), c.Param("rule_id")); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

func (h *CategoryHandler) SetTransactionCategory(c *gin.Context) {
	_, ok := h.resolveUser(c)
	if !ok {
		return
	}

	var body struct {
		CategoryID string `json:"category_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if err := h.categorizationService.SetCategory(
		c.Request.Context(),
		c.Param("id"),
		body.CategoryID,
	); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "updated"})
}

func (h *CategoryHandler) RecategorizeAll(c *gin.Context) {
	userID, ok := h.resolveUser(c)
	if !ok {
		return
	}

	count, err := h.categorizationService.CategorizeAll(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"categorized": count})
}
