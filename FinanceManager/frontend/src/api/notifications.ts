const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

export interface Notification {
  ID: string
  UserID: string
  JobID: string | null
  Title: string
  Body: string
  Read: boolean
  CreatedAt: string
}

export async function fetchNotifications(): Promise<{ notifications: Notification[]; unread_count: number }> {
  const res = await fetch(`${API_BASE_URL}/notifications`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch notifications')
  return res.json()
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, { credentials: 'include' })
  if (!res.ok) return 0
  const data = await res.json()
  return data.unread_count ?? 0
}

export async function markRead(id: string): Promise<void> {
  await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
    method: 'POST',
    credentials: 'include',
  })
}

export async function markAllRead(): Promise<void> {
  await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'POST',
    credentials: 'include',
  })
}