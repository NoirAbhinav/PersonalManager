const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export interface Schedule {
  start_at: string
  end_type: 'never' | 'on_date' | 'after_occurrences'
  end_date?: string
  max_occurrences?: number
  frequency: 'daily' | 'weekly' | 'monthly'
  daily_time?: string
  weekly_days?: number[]
  weekly_time?: string
  monthly_day?: number
  monthly_time?: string
  timezone: string
}

export interface JobConfig {
  email?: string
  period?: string
  conditions?: AlertCondition[]
}

export interface AlertCondition {
  field: 'single_txn_amount' | 'total_spend' | 'category_spend'
  operator: 'gt' | 'lt'
  value: number
  category_id?: string
}

export interface ScheduledJob {
  ID: string
  UserID: string
  Name: string
  JobType: 'sync' | 'digest' | 'alert'
  Enabled: boolean
  Schedule: Schedule
  JobConfig: JobConfig
  LastRunAt: string | null
  NextRunAt: string | null
  OccurrencesRun: number
  CreatedAt: string
}

export interface JobRun {
  ID: string
  JobID: string
  StartedAt: string
  FinishedAt: string | null
  Status: 'success' | 'failed'
  Message: string | null
}

// pgx serializes JSONB []byte fields as base64 when Go's encoding/json
// marshals them. Decode back to objects before using in the frontend.
function decodeJSONB(value: any): any {
  if (typeof value === 'string') {
    try {
      return JSON.parse(atob(value))
    } catch {
      return value
    }
  }
  return value
}

function normalizeJob(job: any): ScheduledJob {
  return {
    ...job,
    Schedule:  decodeJSONB(job.Schedule),
    JobConfig: decodeJSONB(job.JobConfig),
  }
}

export async function fetchJobs(): Promise<ScheduledJob[]> {
  const res = await fetch(`${API_BASE_URL}/finance/scheduler/jobs`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch jobs')
  const data = await res.json()
  return (data.jobs ?? []).map(normalizeJob)
}

export async function createJob(payload: {
  name: string
  job_type: string
  schedule: Schedule
  job_config: JobConfig
}): Promise<ScheduledJob> {
  const res = await fetch(`${API_BASE_URL}/finance/scheduler/jobs`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to create job')
  return normalizeJob(await res.json())
}

export async function updateJob(id: string, payload: {
  name: string
  enabled: boolean
  schedule: Schedule
  job_config: JobConfig
}): Promise<ScheduledJob> {
  const res = await fetch(`${API_BASE_URL}/finance/scheduler/jobs/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to update job')
  return normalizeJob(await res.json())
}

export async function deleteJob(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/finance/scheduler/jobs/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to delete job')
}

export async function fetchJobRuns(jobID: string): Promise<JobRun[]> {
  const res = await fetch(`${API_BASE_URL}/finance/scheduler/jobs/${jobID}/runs`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to fetch job runs')
  const data = await res.json()
  return data.runs ?? []
}