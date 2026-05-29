package scheduler

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/NoirAbhinav/personalmanager/internal/repositories"
)

type JobRunner interface {
	Run(ctx context.Context, job sqlc.ScheduledJob) (string, error)
}

type Engine struct {
	jobRepo   *repositories.ScheduledJobRepository
	notifRepo *repositories.NotificationRepository
	runners   map[string]JobRunner
}

func NewEngine(
	jobRepo *repositories.ScheduledJobRepository,
	notifRepo *repositories.NotificationRepository,
) *Engine {
	return &Engine{
		jobRepo:   jobRepo,
		notifRepo: notifRepo,
		runners:   make(map[string]JobRunner),
	}
}

func (e *Engine) Register(jobType string, runner JobRunner) {
	e.runners[jobType] = runner
}

func (e *Engine) Start(ctx context.Context) {
	log.Println("[scheduler] engine started")
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	// Run immediately on start
	e.tick(ctx)

	for {
		select {
		case <-ctx.Done():
			log.Println("[scheduler] engine stopped")
			return
		case <-ticker.C:
			e.tick(ctx)
		}
	}
}

func (e *Engine) tick(ctx context.Context) {
	jobs, err := e.jobRepo.GetDueJobs(ctx)
	if err != nil {
		log.Printf("[scheduler] error fetching due jobs: %v", err)
		return
	}

	for _, job := range jobs {
		go e.runJob(ctx, job)
	}
}

func (e *Engine) runJob(ctx context.Context, job sqlc.ScheduledJob) {
	runner, ok := e.runners[job.JobType]
	if !ok {
		log.Printf("[scheduler] no runner for job type %q", job.JobType)
		return
	}

	startedAt := time.Now()
	message, err := runner.Run(ctx, job)

	finishedAt := time.Now()
	status := "success"
	if err != nil {
		status = "failed"
		message = err.Error()
		log.Printf("[scheduler] job %s (%s) failed: %v", job.ID, job.JobType, err)
	} else {
		log.Printf("[scheduler] job %s (%s) succeeded: %s", job.ID, job.JobType, message)
	}

	// Record the run
	if repoErr := e.jobRepo.CreateJobRun(ctx, job.ID.String(), startedAt, finishedAt, status, message); repoErr != nil {
		log.Printf("[scheduler] error recording job run: %v", repoErr)
	}

	// Compute next run
	var sched Schedule
	if jsonErr := json.Unmarshal(job.Schedule, &sched); jsonErr != nil {
		log.Printf("[scheduler] error parsing schedule for job %s: %v", job.ID, jsonErr)
		return
	}

	nextRun, nextErr := ComputeNextRun(&sched, time.Now(), int(job.OccurrencesRun)+1)
	if nextErr != nil {
		log.Printf("[scheduler] error computing next run for job %s: %v", job.ID, nextErr)
		return
	}

	// Disable if exhausted (nextRun is zero)
	stillEnabled := job.Enabled && !nextRun.IsZero()

	var nextRunPtr *time.Time
	if !nextRun.IsZero() {
		nextRunPtr = &nextRun
	}

	if repoErr := e.jobRepo.MarkJobRan(ctx, job.ID.String(), time.Now(), nextRunPtr, stillEnabled); repoErr != nil {
		log.Printf("[scheduler] error updating job after run: %v", repoErr)
	}
}
