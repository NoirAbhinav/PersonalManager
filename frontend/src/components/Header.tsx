import { LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

interface HeaderProps {
  title?: string
}

export default function Header({ title = 'PersonalManager' }: HeaderProps) {
  const { logout, email } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">PM</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <a
              href="/categories"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Categories
            </a>
            <a
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </a>
            {email && <span className="text-sm text-gray-600">{email}</span>}

            <button
              onClick={logout}
              className="btn-secondary flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {menuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <a
              href="/categories"
              className="block text-sm text-gray-600 hover:text-gray-900 py-2"
            >
              Categories
            </a>


            <a
              href="/Dashboard"
              className="block text-sm text-gray-600 hover:text-gray-900 py-2"
            >
              Dashboard
            </a>

            {email && (
              <div className="text-sm text-gray-600 py-2">{email}</div>
            )}

            <button
              onClick={() => {
                logout()
                setMenuOpen(false)
              }}
              className="btn-secondary w-full flex items-center justify-center space-x-2 mt-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}