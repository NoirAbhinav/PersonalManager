-- +goose Up
CREATE TABLE scheduled_jobs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name             TEXT NOT NULL,
    job_type         TEXT NOT NULL CHECK (job_type IN ('sync', 'digest', 'alert')),
    enabled          BOOL NOT NULL DEFAULT true,
    schedule         JSONB NOT NULL,
    job_config       JSONB NOT NULL DEFAULT '{}',
    last_run_at      TIMESTAMPTZ,
    next_run_at      TIMESTAMPTZ,
    occurrences_run  INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduled_jobs_next_run ON scheduled_jobs (next_run_at)
    WHERE enabled = true;

CREATE INDEX idx_scheduled_jobs_user ON scheduled_jobs (user_id);

CREATE TABLE job_runs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id      UUID NOT NULL REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    status      TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    message     TEXT
);

CREATE INDEX idx_job_runs_job ON job_runs (job_id, started_at DESC);

CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id     UUID REFERENCES scheduled_jobs(id) ON DELETE SET NULL,
    title      TEXT NOT NULL,
    body       TEXT NOT NULL,
    read       BOOL NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications (user_id, created_at DESC);

-- +goose Down
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS job_runs;
DROP TABLE IF EXISTS scheduled_jobs;