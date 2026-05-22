import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { initiateGoogleLogin } from '../api/auth'
import { Chrome } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check for the non-HttpOnly flag cookie set by the backend
    const cookies = document.cookie.split(';').map(c => c.trim())
    const isAuthenticated = cookies.some(c => c.startsWith('is_authenticated=true'))
    
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
      return
    }

    // Returning from Google OAuth callback
    const params = new URLSearchParams(window.location.search)
    if (params.get('authenticated') === 'true') {
      // Clean the URL and redirect — cookie is already set by backend
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">PM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PersonalManager</h1>
          <p className="text-gray-600">Track your expenses from Gmail alerts</p>
        </div>

        {/* Login Card */}
        <div className="card shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600 text-sm">
              Sign in with your Google account to get started
            </p>
          </div>

          <button
            onClick={initiateGoogleLogin}
            className="w-full btn-primary bg-white text-gray-900 border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 flex items-center justify-center space-x-3 py-3 mb-4"
          >
            <Chrome className="w-5 h-5" />
            <span>Sign in with Google</span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or continue with</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-700">
              <strong>Demo Mode:</strong> Sign in with Google to connect your Gmail account and automatically sync your HDFC Bank transaction alerts.
            </p>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <h3 className="font-semibold text-gray-900 text-sm mb-2">Features:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Automatic Gmail sync</li>
              <li>✓ Transaction categorization</li>
              <li>✓ Real-time balance tracking</li>
              <li>✓ Secure OAuth authentication</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>This app securely accesses only your Gmail read access.</p>
          <p className="mt-1">Your data is never stored on our servers.</p>
        </div>
      </div>
    </div>
  )
}
