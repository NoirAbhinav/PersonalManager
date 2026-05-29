const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export interface AuthState {
  isAuthenticated: boolean
  email?: string
}

export function isAuthenticated(): boolean {
  return document.cookie.split(';').some(c => c.trim().startsWith('is_authenticated=true'))
}

export function initiateGoogleLogin() {
  window.location.href = `${API_BASE_URL}/auth/google/login`
}

export function logout() {
  window.location.href = `${API_BASE_URL}/auth/logout`
}

export async function checkAuthStatus(): Promise<AuthState> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      credentials: 'include',
    })

    if (response.status === 401) {
      // Session expired or invalid — clear the frontend cookie and force re-login.
      // Must include domain to match the cookie set by the backend.
      const domain = window.location.hostname
      document.cookie = `is_authenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`
      // Also clear without domain as fallback (e.g. local dev with no domain set)
      document.cookie = 'is_authenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      return { isAuthenticated: false }
    }

    if (!response.ok) {
      return { isAuthenticated: false }
    }

    const data = await response.json()
    return { isAuthenticated: true, email: data.email }
  } catch {
    return { isAuthenticated: false }
  }
}