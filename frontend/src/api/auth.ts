const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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
    const response = await fetch(`${API_BASE_URL}/api/me`, {
      credentials: 'include', // sends session_user cookie
    })

    if (response.ok) {
      const data = await response.json()
      return { isAuthenticated: true, email: data.email }
    }

    return { isAuthenticated: false }
  } catch {
    return { isAuthenticated: false }
  }
}