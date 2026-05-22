import { useEffect, useState } from 'react'
import { isAuthenticated as checkCookie, checkAuthStatus, logout as apiLogout } from '../api/auth'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState<string | undefined>()

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      try {
        // Fast check first — no network call
        if (!checkCookie()) {
          setIsAuthenticated(false)
          return
        }

        // Cookie exists — verify with backend and get email
        const auth = await checkAuthStatus()
        setIsAuthenticated(auth.isAuthenticated)
        setEmail(auth.email)
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const logout = () => {
    setIsAuthenticated(false)
    setEmail(undefined)
    apiLogout() // redirects to backend /auth/logout which clears cookies
  }

  return { isAuthenticated, isLoading, email, logout }
}