import { Link } from 'react-router-dom'
import { LayoutDashboard, Film, Users, BarChart3, Settings, Upload, List, X, Home } from 'lucide-react'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
  { icon: Film, label: 'Series', key: 'series' },
  { icon: Upload, label: 'Add Content', key: 'add' },
  { icon: List, label: 'Episodes', key: 'episodes' },
  { icon: Users, label: 'Users', key: 'users' },
  { icon: BarChart3, label: 'Analytics', key: 'analytics' },
  { icon: Settings, label: 'Settings', key: 'settings' },
]

export default function AdminSidebar({ activeSection, onNavigate, mobileOpen = false, onCloseMobile = () => {} }) {
  const handleNavigate = (key) => {
    onNavigate(key)
    onCloseMobile()
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-[#1E1E2E] bg-[#0D0D14] transition-transform duration-300 lg:static lg:z-auto lg:w-56 lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col pt-6">
        <div className="mb-8 flex items-start justify-between px-5">
          <div>
            <Link to="/" className="block">
              <img
                src="/icons/logo.png"
                alt="Black Shortz"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-gray-600">Admin Panel</p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-md p-1 text-gray-400 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map(({ icon: Icon, label, key }) => {
            const active = activeSection === key
            return (
              <button
                key={key}
                onClick={() => handleNavigate(key)}
                className={`sidebar-link w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                  active ? 'active bg-[#D4A017]/15 text-[#D4A017]' : 'text-gray-400'
                } flex items-center gap-3`}
              >
                <Icon size={16} />
                <span className="truncate">{label}</span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-[#1E1E2E] px-5 py-4">
          <Link
            to="/"
            className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#2a2a3d] bg-[#D4A017]/10 px-3 py-2 text-xs font-medium text-[#D4A017] transition-colors hover:bg-[#D4A017]/20"
          >
            <Home size={14} /> Go to Home
          </Link>
          <p className="text-[10px] text-gray-600">v1.0.0 · Admin Mode</p>
        </div>
      </div>
    </aside>
  )
}
