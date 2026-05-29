import { useEffect, useState } from 'react'
import { isAuthenticated as checkCookie, checkAuthStatus, logout as apiLogout } from '../api/auth'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(checkCookie()) // ✅ seed from cookie synchronously
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState<string | undefined>()

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      try {
        if (!checkCookie()) {
          setIsAuthenticated(false)
          return
        }

        const auth = await checkAuthStatus()
        setIsAuthenticated(auth.isAuthenticated)
        setEmail(auth.email)

        // If /api/me returned 401, cookie was cleared above
        // isAuthenticated is false, router will redirect to /login
      } catch {
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false) // always unblock the UI
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