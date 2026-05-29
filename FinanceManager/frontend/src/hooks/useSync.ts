import { useState, useCallback, useRef, useEffect } from 'react'
import { syncGmailTransactions, getSyncStatus } from '../api/sync'

type SyncStatus = 'idle' | 'syncing' | 'completed' | 'failed'

interface Progress {
  current: number
  total: number
}

export function useSync(onSuccess?: () => void) {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<Progress>({ current: 0, total: 0 })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const startPolling = useCallback(() => {
    if (pollRef.current) return // already polling

    pollRef.current = setInterval(async () => {
      try {
        const data = await getSyncStatus()
        setStatus(data.status)
        setProgress({ current: data.progress_current, total: data.progress_total })

        if (data.status === 'completed') {
          stopPolling()
          onSuccess?.()
        } else if (data.status === 'failed') {
          stopPolling()
          setError(data.error || 'Sync failed')
        }
      } catch (err) {
        console.warn('Status poll failed, retrying...', err)
      }
    }, 2000)
  }, [onSuccess])

  // On mount — check if a sync is already in progress from a previous session
  useEffect(() => {
    const checkOnMount = async () => {
      try {
        const data = await getSyncStatus()
        setStatus(data.status)
        setProgress({ current: data.progress_current, total: data.progress_total })

        if (data.status === 'syncing') {
          startPolling() // resume polling
        } else if (data.status === 'completed') {
          onSuccess?.()
        }
      } catch (err) {
        console.warn('Initial status check failed', err)
      }
    }

    checkOnMount()

    return () => stopPolling() // cleanup on unmount
  }, [])

  const sync = useCallback(async () => {
    try {
      setStatus('syncing')
      setError(null)
      setProgress({ current: 0, total: 0 })
      await syncGmailTransactions()
      startPolling()
    } catch (err) {
      setStatus('failed')
      setError(err instanceof Error ? err.message : 'Sync failed')
    }
  }, [startPolling])

  return { sync, status, error, progress }
}