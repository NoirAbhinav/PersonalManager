import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Header from '../components/Header'
import { useScheduler, useJobRuns } from '../hooks/useScheduler'
import { ScheduledJob, Schedule, JobConfig, createJob } from '../api/scheduler'

import { Plus, Trash2, ChevronDown, ChevronUp, Power, CheckCircle, XCircle, Clock } from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatNextRun(dt: string | null) {
  if (!dt) return '—'
  const d = new Date(dt)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function jobTypeLabel(t: string) {
  return { sync: 'Sync', digest: 'Digest', alert: 'Alert' }[t] ?? t
}

function jobTypeBadgeColor(t: string) {
  return {
    sync:   'bg-blue-100 text-blue-700',
    digest: 'bg-purple-100 text-purple-700',
    alert:  'bg-orange-100 text-orange-700',
  }[t] ?? 'bg-gray-100 text-gray-700'
}

// ── Job Runs panel ────────────────────────────────────────────────────────────

function JobRunsPanel({ jobID }: { jobID: string }) {
  const { data: runs = [], isLoading } = useJobRuns(jobID)

  if (isLoading) return <p className="text-sm text-gray-400 py-2">Loading runs…</p>
  if (runs.length === 0) return <p className="text-sm text-gray-400 py-2">No runs yet</p>

  return (
    <div className="space-y-2">
      {runs.map(r => (
        <div key={r.ID} className="flex items-start gap-3 text-sm">
          {r.Status === 'success'
            ? <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            : <XCircle    className="w-4 h-4 text-red-500   mt-0.5 flex-shrink-0" />
          }
          <div>
            <p className="text-gray-700">{new Date(r.StartedAt).toLocaleString()}</p>
            {r.Message && <p className="text-xs text-gray-500">{r.Message}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Job card ──────────────────────────────────────────────────────────────────

function JobCard({ job }: { job: ScheduledJob }) {
  const [expanded, setExpanded] = useState(false)
  const { toggleJob, deleteJob } = useScheduler()

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${jobTypeBadgeColor(job.JobType)}`}>
            {jobTypeLabel(job.JobType)}
          </span>
          <span className="font-medium text-gray-900 truncate">{job.Name}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatNextRun(job.NextRunAt)}</span>
          </div>

          <button
            onClick={() => toggleJob(job)}
            title={job.Enabled ? 'Disable' : 'Enable'}
            className={`p-1.5 rounded-lg transition-colors ${
              job.Enabled
                ? 'text-green-600 hover:bg-green-50'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <Power className="w-4 h-4" />
          </button>

          <button
            onClick={() => deleteJob(job.ID)}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          <p className="text-xs font-medium text-gray-500 mb-2">Run history</p>
          <JobRunsPanel jobID={job.ID} />
        </div>
      )}
    </div>
  )
}

// ── Job form ──────────────────────────────────────────────────────────────────

const DEFAULT_SCHEDULE: Schedule = {
  start_at: new Date().toISOString(),
  end_type: 'never',
  frequency: 'daily',
  daily_time: '09:00',
  weekly_days: [1],
  weekly_time: '09:00',
  monthly_day: 1,
  monthly_time: '09:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
}

function JobForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [jobType, setJobType] = useState<'sync' | 'digest' | 'alert'>('sync')
  const [schedule, setSchedule] = useState<Schedule>({ ...DEFAULT_SCHEDULE })
  const [email, setEmail] = useState('')
  const [alertField, setAlertField] = useState<'single_txn_amount' | 'total_spend' | 'category_spend'>('single_txn_amount')
  const [alertOperator, setAlertOperator] = useState<'gt' | 'lt'>('gt')
  const [alertValue, setAlertValue] = useState('')

  const mutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduler-jobs'] })
      onClose()
    },
  })

  const setScheduleField = (key: keyof Schedule, value: any) =>
    setSchedule(s => ({ ...s, [key]: value }))

  const toggleWeekday = (day: number) => {
    const days = schedule.weekly_days ?? []
    setScheduleField(
      'weekly_days',
      days.includes(day) ? days.filter(d => d !== day) : [...days, day].sort()
    )
  }

  const buildJobConfig = (): JobConfig => {
    if (jobType === 'sync') return {}
    if (jobType === 'digest') return { email, period: schedule.frequency }
    return {
      email,
      conditions: [{
        field: alertField,
        operator: alertOperator,
        value: parseFloat(alertValue) || 0,
      }],
    }
  }

  const handleSubmit = () => {
    mutation.mutate({
      name,
      job_type: jobType,
      schedule,
      job_config: buildJobConfig(),
    })
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelCls = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">New Scheduled Job</h2>
          <div className="flex gap-1">
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full ${step >= s ? 'bg-blue-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Step 1: Name + Type */}
          {step === 1 && (
            <>
              <div>
                <label className={labelCls}>Job name</label>
                <input
                  className={inputCls}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Daily sync"
                  autoFocus
                />
              </div>
              <div>
                <label className={labelCls}>Job type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['sync', 'digest', 'alert'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setJobType(t)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                        jobType === t
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {jobTypeLabel(t)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {jobType === 'sync'   && 'Automatically sync Gmail transactions on a schedule.'}
                  {jobType === 'digest' && 'Receive a spending summary email periodically.'}
                  {jobType === 'alert'  && 'Get notified when spending crosses a threshold.'}
                </p>
              </div>
            </>
          )}

          {/* Step 2: Frequency */}
          {step === 2 && (
            <>
              <div>
                <label className={labelCls}>Start date</label>
                <input
                  type="date"
                  className={inputCls}
                  value={schedule.start_at.split('T')[0]}
                  onChange={e => setScheduleField('start_at', e.target.value + 'T00:00:00Z')}
                />
              </div>
              <div>
                <label className={labelCls}>Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setScheduleField('frequency', f)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                        schedule.frequency === f
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {schedule.frequency === 'daily' && (
                <div>
                  <label className={labelCls}>Time</label>
                  <input type="time" className={inputCls} value={schedule.daily_time}
                    onChange={e => setScheduleField('daily_time', e.target.value)} />
                </div>
              )}

              {schedule.frequency === 'weekly' && (
                <>
                  <div>
                    <label className={labelCls}>Days</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS.map((d, i) => (
                        <button
                          key={i}
                          onClick={() => toggleWeekday(i)}
                          className={`w-10 h-10 rounded-full text-xs font-medium border transition-colors ${
                            schedule.weekly_days?.includes(i)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Time</label>
                    <input type="time" className={inputCls} value={schedule.weekly_time}
                      onChange={e => setScheduleField('weekly_time', e.target.value)} />
                  </div>
                </>
              )}

              {schedule.frequency === 'monthly' && (
                <>
                  <div>
                    <label className={labelCls}>Day of month (1–28)</label>
                    <input type="number" min={1} max={28} className={inputCls}
                      value={schedule.monthly_day}
                      onChange={e => setScheduleField('monthly_day', parseInt(e.target.value))} />
                  </div>
                  <div>
                    <label className={labelCls}>Time</label>
                    <input type="time" className={inputCls} value={schedule.monthly_time}
                      onChange={e => setScheduleField('monthly_time', e.target.value)} />
                  </div>
                </>
              )}
            </>
          )}

          {/* Step 3: End condition */}
          {step === 3 && (
            <>
              <div>
                <label className={labelCls}>End condition</label>
                <div className="space-y-2">
                  {(['never', 'on_date', 'after_occurrences'] as const).map(et => (
                    <label key={et} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={schedule.end_type === et}
                        onChange={() => setScheduleField('end_type', et)}
                        className="text-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {et === 'never'             && 'Never ends'}
                        {et === 'on_date'           && 'End on a specific date'}
                        {et === 'after_occurrences' && 'End after N occurrences'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {schedule.end_type === 'on_date' && (
                <div>
                  <label className={labelCls}>End date</label>
                  <input type="date" className={inputCls}
                    onChange={e => setScheduleField('end_date', e.target.value + 'T23:59:59Z')} />
                </div>
              )}

              {schedule.end_type === 'after_occurrences' && (
                <div>
                  <label className={labelCls}>Number of occurrences</label>
                  <input type="number" min={1} className={inputCls}
                    value={schedule.max_occurrences ?? ''}
                    onChange={e => setScheduleField('max_occurrences', parseInt(e.target.value))} />
                </div>
              )}
            </>
          )}

          {/* Step 4: Job-specific config */}
          {step === 4 && (
            <>
              {jobType === 'sync' && (
                <p className="text-sm text-gray-500">No additional configuration needed for sync jobs.</p>
              )}

              {jobType === 'digest' && (
                <div>
                  <label className={labelCls}>Send digest to email</label>
                  <input type="email" className={inputCls} value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@gmail.com" />
                </div>
              )}

              {jobType === 'alert' && (
                <>
                  <div>
                    <label className={labelCls}>Send alerts to email</label>
                    <input type="email" className={inputCls} value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@gmail.com" />
                  </div>
                  <div>
                    <label className={labelCls}>Alert condition</label>
                    <div className="flex gap-2">
                      <select className={inputCls} value={alertField}
                        onChange={e => setAlertField(e.target.value as any)}>
                        <option value="single_txn_amount">Single transaction</option>
                        <option value="total_spend">Total spend</option>
                        <option value="category_spend">Category spend</option>
                      </select>
                      <select className={`${inputCls} w-24`} value={alertOperator}
                        onChange={e => setAlertOperator(e.target.value as 'gt' | 'lt')}>
                        <option value="gt">{'>'}</option>
                        <option value="lt">{'<'}</option>
                      </select>
                      <input type="number" className={`${inputCls} w-28`}
                        value={alertValue} onChange={e => setAlertValue(e.target.value)}
                        placeholder="₹ amount" />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button
            onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && !name.trim()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {mutation.isPending ? 'Creating…' : 'Create job'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Scheduler() {
  const { jobs, isLoading, error } = useScheduler()
  const [showForm, setShowForm] = useState(false)

  const syncJobs    = jobs.filter(j => j.JobType === 'sync')
  const digestJobs  = jobs.filter(j => j.JobType === 'digest')
  const alertJobs   = jobs.filter(j => j.JobType === 'alert')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Scheduler" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{jobs.length} job{jobs.length !== 1 ? 's' : ''} configured</p>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            New job
          </button>
        </div>

        {isLoading && <p className="text-sm text-gray-400 text-center py-12">Loading…</p>}
        {error    && <p className="text-sm text-red-500 text-center py-12">{error}</p>}

        {!isLoading && jobs.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500">No scheduled jobs yet</p>
            <p className="text-sm text-gray-400 mt-1">Create one to automate syncs, digests, and alerts</p>
          </div>
        )}

        {syncJobs.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sync</h2>
            <div className="space-y-3">{syncJobs.map(j => <JobCard key={j.ID} job={j} />)}</div>
          </section>
        )}

        {digestJobs.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Digest</h2>
            <div className="space-y-3">{digestJobs.map(j => <JobCard key={j.ID} job={j} />)}</div>
          </section>
        )}

        {alertJobs.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Alerts</h2>
            <div className="space-y-3">{alertJobs.map(j => <JobCard key={j.ID} job={j} />)}</div>
          </section>
        )}
      </main>

      {showForm && <JobForm onClose={() => setShowForm(false)} />}
    </div>
  )
}