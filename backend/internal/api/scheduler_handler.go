package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
	"github.com/NoirAbhinav/personalmanager/internal/scheduler"
	"github.com/gin-gonic/gin"
)

type SchedulerHandler struct {
	jobRepo  *repositories.ScheduledJobRepository
	userRepo *repositories.UserRepository
}

func NewSchedulerHandler(
	jobRepo *repositories.ScheduledJobRepository,
	userRepo *repositories.UserRepository,
) *SchedulerHandler {
	return &SchedulerHandler{jobRepo: jobRepo, userRepo: userRepo}
}

type createJobRequest struct {
	Name      string          `json:"name"`
	JobType   string          `json:"job_type"`
	Schedule  json.RawMessage `json:"schedule"`
	JobConfig json.RawMessage `json:"job_config"`
}

type updateJobRequest struct {
	Name      string          `json:"name"`
	Enabled   bool            `json:"enabled"`
	Schedule  json.RawMessage `json:"schedule"`
	JobConfig json.RawMessage `json:"job_config"`
}

func (h *SchedulerHandler) userIDFromCookie(c *gin.Context) (string, error) {
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

func (h *SchedulerHandler) ListJobs(c *gin.Context) {
	userID, err := h.userIDFromCookie(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	jobs, err := h.jobRepo.GetByUserID(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if jobs == nil {
		jobs = make([]sqlc.ScheduledJob, 0)
	}

	c.JSON(http.StatusOK, gin.H{"jobs": jobs})
}

func (h *SchedulerHandler) CreateJob(c *gin.Context) {
	userID, err := h.userIDFromCookie(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	var req createJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name == "" || req.JobType == "" || req.Schedule == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name, job_type, and schedule are required"})
		return
	}

	// Parse schedule to compute first next_run_at
	sched, err := scheduler.ParseSchedule(req.Schedule)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid schedule: " + err.Error()})
		return
	}

	nextRun, err := scheduler.ComputeNextRun(sched, time.Now(), 0)
	if err != nil || nextRun.IsZero() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "schedule produces no future run times"})
		return
	}

	jobConfig := req.JobConfig
	if jobConfig == nil {
		jobConfig = json.RawMessage("{}")
	}

	job, err := h.jobRepo.Create(
		c.Request.Context(),
		userID,
		req.Name,
		req.JobType,
		true,
		req.Schedule,
		jobConfig,
		&nextRun,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, job)
}

func (h *SchedulerHandler) UpdateJob(c *gin.Context) {
	userID, err := h.userIDFromCookie(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	id := c.Param("id")

	// Verify ownership
	existing, err := h.jobRepo.GetByID(c.Request.Context(), id)
	if err != nil || existing.UserID.String() != userID {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	var req updateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sched, err := scheduler.ParseSchedule(req.Schedule)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid schedule: " + err.Error()})
		return
	}

	nextRun, err := scheduler.ComputeNextRun(sched, time.Now(), int(existing.OccurrencesRun))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "could not compute next run: " + err.Error()})
		return
	}

	var nextRunPtr *time.Time
	if !nextRun.IsZero() {
		nextRunPtr = &nextRun
	}

	job, err := h.jobRepo.Update(
		c.Request.Context(),
		id,
		req.Name,
		req.Enabled,
		req.Schedule,
		req.JobConfig,
		nextRunPtr,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, job)
}

func (h *SchedulerHandler) DeleteJob(c *gin.Context) {
	userID, err := h.userIDFromCookie(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	id := c.Param("id")

	existing, err := h.jobRepo.GetByID(c.Request.Context(), id)
	if err != nil || existing.UserID.String() != userID {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	if err := h.jobRepo.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"deleted": true})
}

func (h *SchedulerHandler) GetJobRuns(c *gin.Context) {
	userID, err := h.userIDFromCookie(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	id := c.Param("id")

	existing, err := h.jobRepo.GetByID(c.Request.Context(), id)
	if err != nil || existing.UserID.String() != userID {
		c.JSON(http.StatusNotFound, gin.H{"error": "job not found"})
		return
	}

	runs, err := h.jobRepo.GetJobRuns(c.Request.Context(), id, 20)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if runs == nil {
		runs = make([]sqlc.JobRun, 0)
	}

	c.JSON(http.StatusOK, gin.H{"runs": runs})
}
