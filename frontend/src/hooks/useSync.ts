import { useState, useCallback, useRef } from 'react'
import { syncGmailTransactions, getSyncStatus } from '../api/sync'

type SyncStatus = 'idle' | 'syncing' | 'completed' | 'failed'

export function useSync(onSuccess?: () => void) {
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const startPolling = useCallback(() => {
    pollRef.current = setInterval(async () => {
      try {
        const data = await getSyncStatus()
        setStatus(data.status)

        if (data.status === 'completed') {
          stopPolling()
          onSuccess?.()
        } else if (data.status === 'failed') {
          stopPolling()
          setError(data.error || 'Sync failed')
        }
      } catch (err) {
        stopPolling()
        setError('Failed to get sync status')
      }
    }, 2000)
  }, [onSuccess])

  const sync = useCallback(async () => {
    try {
      setStatus('syncing')
      setError(null)
      await syncGmailTransactions()
      startPolling()
    } catch (err) {
      setStatus('failed')
      setError(err instanceof Error ? err.message : 'Sync failed')
    }
  }, [startPolling])

  return { sync, status, error }
}