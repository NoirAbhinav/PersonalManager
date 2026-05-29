package repositories

import (
	"context"
	"encoding/json"
	"time"

	"github.com/NoirAbhinav/personalmanager/internal/db/sqlc"
	"github.com/jackc/pgx/v5/pgtype"
)

type ScheduledJobRepository struct {
	queries *sqlc.Queries
}

func NewScheduledJobRepository(queries *sqlc.Queries) *ScheduledJobRepository {
	return &ScheduledJobRepository{queries: queries}
}

func (r *ScheduledJobRepository) Create(
	ctx context.Context,
	userID, name, jobType string,
	enabled bool,
	schedule, jobConfig any,
	nextRunAt *time.Time,
) (sqlc.ScheduledJob, error) {
	// If already json.RawMessage, use as-is; otherwise marshal
	schedJSON, err := toJSON(schedule)
	if err != nil {
		return sqlc.ScheduledJob{}, err
	}
	cfgJSON, err := toJSON(jobConfig)
	if err != nil {
		return sqlc.ScheduledJob{}, err
	}

	return r.queries.CreateScheduledJob(ctx, sqlc.CreateScheduledJobParams{
		UserID:    pgtype.UUID{Bytes: uuidFromString(userID), Valid: true},
		Name:      name,
		JobType:   jobType,
		Enabled:   enabled,
		Schedule:  schedJSON,
		JobConfig: cfgJSON,
		NextRunAt: optionalTimestamptz(nextRunAt),
	})
}

func (r *ScheduledJobRepository) Update(
	ctx context.Context,
	id, name string,
	enabled bool,
	schedule, jobConfig any,
	nextRunAt *time.Time,
) (sqlc.ScheduledJob, error) {
	schedJSON, err := toJSON(schedule)
	if err != nil {
		return sqlc.ScheduledJob{}, err
	}
	cfgJSON, err := toJSON(jobConfig)
	if err != nil {
		return sqlc.ScheduledJob{}, err
	}

	return r.queries.UpdateScheduledJob(ctx, sqlc.UpdateScheduledJobParams{
		ID:        pgtype.UUID{Bytes: uuidFromString(id), Valid: true},
		Name:      name,
		Enabled:   enabled,
		Schedule:  schedJSON,
		JobConfig: cfgJSON,
		NextRunAt: optionalTimestamptz(nextRunAt),
	})
}

// toJSON avoids double-encoding json.RawMessage values
func toJSON(v any) ([]byte, error) {
	if raw, ok := v.(json.RawMessage); ok {
		return raw, nil
	}
	return json.Marshal(v)
}

func (r *ScheduledJobRepository) GetByUserID(ctx context.Context, userID string) ([]sqlc.ScheduledJob, error) {
	return r.queries.GetScheduledJobsByUserID(ctx, pgtype.UUID{Bytes: uuidFromString(userID), Valid: true})
}

func (r *ScheduledJobRepository) GetByID(ctx context.Context, id string) (sqlc.ScheduledJob, error) {
	return r.queries.GetScheduledJobByID(ctx, pgtype.UUID{Bytes: uuidFromString(id), Valid: true})
}

func (r *ScheduledJobRepository) Delete(ctx context.Context, id string) error {
	return r.queries.DeleteScheduledJob(ctx, pgtype.UUID{Bytes: uuidFromString(id), Valid: true})
}

func (r *ScheduledJobRepository) GetDueJobs(ctx context.Context) ([]sqlc.ScheduledJob, error) {
	return r.queries.GetDueJobs(ctx)
}

func (r *ScheduledJobRepository) MarkJobRan(
	ctx context.Context,
	id string,
	lastRunAt time.Time,
	nextRunAt *time.Time,
	enabled bool,
) error {
	return r.queries.MarkJobRan(ctx, sqlc.MarkJobRanParams{
		ID:        pgtype.UUID{Bytes: uuidFromString(id), Valid: true},
		LastRunAt: optionalTimestamptz(&lastRunAt),
		NextRunAt: optionalTimestamptz(nextRunAt),
		Enabled:   enabled,
	})
}

func (r *ScheduledJobRepository) CreateJobRun(
	ctx context.Context,
	jobID string,
	startedAt, finishedAt time.Time,
	status, message string,
) error {
	return r.queries.CreateJobRun(ctx, sqlc.CreateJobRunParams{
		JobID:      pgtype.UUID{Bytes: uuidFromString(jobID), Valid: true},
		StartedAt:  pgtype.Timestamptz{Time: startedAt, Valid: true},
		FinishedAt: optionalTimestamptz(&finishedAt),
		Status:     status,
		Message:    pgtype.Text{String: message, Valid: message != ""},
	})
}

func (r *ScheduledJobRepository) GetJobRuns(ctx context.Context, jobID string, limit int32) ([]sqlc.JobRun, error) {
	return r.queries.GetJobRunsByJobID(ctx, sqlc.GetJobRunsByJobIDParams{
		JobID: pgtype.UUID{Bytes: uuidFromString(jobID), Valid: true},
		Limit: limit,
	})
}
