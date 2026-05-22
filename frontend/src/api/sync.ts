import { SyncResponse } from '../types/transaction'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export async function syncGmailTransactions(): Promise<SyncResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/sync/gmail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Sync failed')
    }

    const data: SyncResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error syncing Gmail transactions:', error)
    throw error
  }
}

export async function getLastSyncTime(): Promise<string | null> {
  try {
    const lastSync = localStorage.getItem('lastSyncTime')
    return lastSync
  } catch (error) {
    console.error('Error getting last sync time:', error)
    return null
  }
}

export function setLastSyncTime() {
  const now = new Date().toISOString()
  localStorage.setItem('lastSyncTime', now)
  return now
}

export async function getSyncStatus() {
  const res = await fetch(`${API_BASE_URL}/sync/status`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Failed to get sync status')
  return res.json() as Promise<{
    status: 'idle' | 'syncing' | 'completed' | 'failed'
    error?: string
    updated_at?: string
  }>
}