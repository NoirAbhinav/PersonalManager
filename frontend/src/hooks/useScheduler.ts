import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchJobs, createJob, updateJob, deleteJob, fetchJobRuns, ScheduledJob } from '../api/scheduler'


export function useScheduler() {
  const queryClient = useQueryClient()

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ['scheduler-jobs'],
    queryFn: fetchJobs,
    staleTime: 30000,
  })

  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduler-jobs'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Parameters<typeof updateJob>[1]) =>
      updateJob(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduler-jobs'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['scheduler-jobs'] }),
  })

  const toggleJob = (job: ScheduledJob) =>
    updateMutation.mutate({
      id: job.ID,
      name: job.Name,
      enabled: !job.Enabled,
      schedule: job.Schedule,
      job_config: job.JobConfig,
    })

  return {
    jobs,
    isLoading,
    error: error instanceof Error ? error.message : null,
    createJob: createMutation.mutate,
    updateJob: updateMutation.mutate,
    deleteJob: deleteMutation.mutate,
    toggleJob,
    isCreating: createMutation.isPending,
  }
}

export function useJobRuns(jobID: string | null) {
  return useQuery({
    queryKey: ['job-runs', jobID],
    queryFn: () => fetchJobRuns(jobID!),
    enabled: !!jobID,
    staleTime: 10000,
  })
}