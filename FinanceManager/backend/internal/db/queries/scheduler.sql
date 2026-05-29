-- name: CreateScheduledJob :one
INSERT INTO scheduled_jobs (user_id, name, job_type, enabled, schedule, job_config, next_run_at)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetScheduledJobsByUserID :many
SELECT * FROM scheduled_jobs
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: GetScheduledJobByID :one
SELECT * FROM scheduled_jobs
WHERE id = $1;

-- name: UpdateScheduledJob :one
UPDATE scheduled_jobs
SET name = $2, enabled = $3, schedule = $4, job_config = $5, next_run_at = $6
WHERE id = $1
RETURNING *;

-- name: DeleteScheduledJob :exec
DELETE FROM scheduled_jobs WHERE id = $1;

-- name: GetDueJobs :many
SELECT * FROM scheduled_jobs
WHERE enabled = true
  AND next_run_at IS NOT NULL
  AND next_run_at <= now()
ORDER BY next_run_at ASC;

-- name: MarkJobRan :exec
UPDATE scheduled_jobs
SET last_run_at     = $2,
    next_run_at     = $3,
    occurrences_run = occurrences_run + 1,
    enabled         = $4
WHERE id = $1;

-- name: CreateJobRun :exec
INSERT INTO job_runs (job_id, started_at, finished_at, status, message)
VALUES ($1, $2, $3, $4, $5);

-- name: GetJobRunsByJobID :many
SELECT * FROM job_runs
WHERE job_id = $1
ORDER BY started_at DESC
LIMIT $2;