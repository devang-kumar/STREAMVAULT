import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, Play, Star, X, ChevronRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getMe, updateContinueWatching } from '../api/client'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(user)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setIsLoading(true)
        setError('')
        const data = await getMe()
        if (!mounted) return
        setProfile(data?.user ?? data)
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'Failed to load profile.')
        setProfile(user)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [user])

  useEffect(() => {
    if (!settingsOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [settingsOpen])

  if (!profile && !isLoading) {
    navigate('/login')
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const continueList = profile?.continueWatching || []
  const avatarUrl = profile?.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(profile?.name || 'user')}`

  return (
    <div className="min-h-screen bg-[#0A0A0F] px-4 pb-16 pt-24 sm:px-6">
      {error && <div className="mx-auto mb-4 max-w-5xl rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>}

      {isLoading ? (
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-28 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-20 animate-pulse rounded-xl bg-white/5" />
          <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
        </div>
      ) : (
        <div className="mx-auto max-w-5xl">
          <div className="glass mb-6 flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
            <div className="relative">
              <img src={avatarUrl} alt={profile?.name} className="h-20 w-20 rounded-2xl border-2 border-[#D4A017] object-cover" />
              <span className="badge-premium absolute -bottom-2 -right-2">{profile?.plan}</span>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold text-white">{profile?.name}</h1>
              <p className="truncate text-sm text-gray-400">{profile?.email}</p>
              <p className="mt-1 text-xs text-gray-600">Member since {profile?.since || 'N/A'}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettingsOpen(true)}
                className="glass rounded-xl p-2.5 text-white transition-all hover:bg-white/10"
                aria-label="Open account settings"
              >
                <Settings size={16} />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-xl bg-[#D4A017]/10 px-4 py-2.5 text-sm font-medium text-[#D4A017] transition-all hover:bg-[#D4A017]/20"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl p-4 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-white">
              <Play size={16} className="text-[#D4A017]" /> Continue Watching
            </h2>
            <div className="space-y-3">
              {continueList.length === 0 ? (
                <p className="text-sm text-gray-500">No watched content yet. Start browsing!</p>
              ) : (
                continueList.map((item) => (
                  <div
                    key={`${item.showId}-${item.episode}`}
                    onClick={async () => {
                      try {
                        await updateContinueWatching(item.showId, item.episode, item.progress)
                      } catch (_err) {}
                      navigate(`/watch/${item.showId}/${item.episode}`)
                    }}
                    className="group flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/5"
                  >
                    <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#111118]">
                      <div className="flex h-full w-full items-center justify-center bg-white/5">
                        <Play size={16} className="text-gray-500" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
                        <div className="h-full bg-[#D4A017]" style={{ width: `${item.progress || 0}%` }} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">Show {item.showId}</p>
                      <p className="truncate text-xs text-gray-500">Episode {item.episode} — {item.progress}% complete</p>
                    </div>
                    <p className="text-xs text-gray-500">{item.progress}%</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass mt-6 rounded-2xl p-4 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-white">
              <Star size={16} className="fill-[#F5C518] text-[#F5C518]" /> Your Subscription
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-white font-semibold">{profile?.plan} Plan</p>
                <p className="text-sm text-gray-400">Manage your subscription anytime</p>
              </div>
              <button onClick={() => navigate('/subscription')} className="w-full rounded-lg bg-[#D4A017]/10 px-4 py-2 text-sm text-[#D4A017] transition-colors hover:bg-[#D4A017]/20 sm:w-auto">Upgrade Plan</button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${settingsOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        <button className="absolute inset-0 bg-black/60" onClick={() => setSettingsOpen(false)} aria-label="Close settings" />

        <aside
          className={`glass absolute left-1/2 top-1/2 max-h-[90vh] w-[92%] max-w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#1E1E2E] bg-[#09090e] p-4 transition-all duration-300 ${
            settingsOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div className="mb-5 flex items-center justify-between rounded-xl border border-[#1E1E2E] bg-[#0c0c14] p-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={avatarUrl} alt={profile?.name} className="h-10 w-10 rounded-lg border border-[#D4A017]/50" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{profile?.name}</p>
                <p className="truncate text-[11px] text-gray-500">{profile?.email}</p>
              </div>
            </div>
            <button onClick={() => setSettingsOpen(false)} className="rounded p-1 text-gray-400 hover:text-white" aria-label="Close panel">
              <X size={16} />
            </button>
          </div>

          <div className="mb-4 flex flex-col items-center rounded-xl border border-[#1E1E2E] bg-black/40 p-4 text-center">
            <img src={avatarUrl} alt={profile?.name} className="mb-2 h-20 w-20 rounded-full border border-[#D4A017]/40 object-cover" />
            <p className="text-xl font-semibold text-[#D4A017]">{profile?.name}</p>
            <p className="text-xs text-gray-500">{profile?.email}</p>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Subscription', value: profile?.plan || 'Free' },
              { label: 'Email', value: profile?.email || '-' },
              { label: 'Password', value: '••••••••', action: 'Change' },
              { label: 'Parental Controls', value: 'Off' },
            ].map((row) => (
              <button key={row.label} className="flex w-full items-center justify-between rounded-md border border-[#2a2a3d] bg-[#0e0e16] px-3 py-2 text-left transition-colors hover:border-[#D4A017]/50">
                <span className="text-xs text-gray-300">{row.label}</span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  {row.action || row.value} <ChevronRight size={12} />
                </span>
              </button>
            ))}
          </div>

          <button className="mt-4 w-full rounded-md border border-[#D4A017]/40 bg-[#D4A017]/10 px-3 py-2 text-xs font-semibold text-[#D4A017] transition-colors hover:bg-[#D4A017]/20">
            EDIT PROFILE
          </button>
        </aside>
      </div>
    </div>
  )
}
