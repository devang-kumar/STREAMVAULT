import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Settings, Play, Star, X, ChevronRight, Shield, Mail, Lock, Check, AlertCircle, Loader, Crown, Calendar, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getMe, updateContinueWatching, changeEmail, changePassword, getSubscription, cancelSubscription, updatePlan, updateUserProfile } from '../api/client'

function SubscriptionModal({ profile, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [sub, setSub] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const data = await getSubscription()
        if (mounted) setSub(data?.subscription)
      } catch (err) {
        if (mounted) setSub({ plan: profile?.plan || 'Basic', status: profile?.plan || 'Basic', isActive: profile?.plan === 'Premium', expiryDate: null, planId: null })
      }
    })()
    return () => { mounted = false }
  }, [profile])

  const handlePlanChange = async (planLabel) => {
    const apiPlanName = planLabel === 'Free' ? 'Basic' : planLabel
    if (apiPlanName === sub?.plan) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await updatePlan(apiPlanName)
      setSuccess(`Plan changed to ${planLabel} successfully!`)
      setSub(prev => ({ ...prev, plan: apiPlanName, status: apiPlanName, isActive: apiPlanName === 'Premium', expiryDate: apiPlanName === 'Premium' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null }))
      if (onRefresh) onRefresh()
    } catch (err) {
      setError(err.message || 'Failed to change plan')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return
    setLoading(true)
    setError('')
    try {
      await cancelSubscription()
      setSuccess('Subscription cancelled. You are now on the Free plan.')
      setSub(prev => ({ ...prev, plan: 'Basic', status: 'Basic', isActive: false }))
      if (onRefresh) onRefresh()
    } catch (err) {
      setError(err.message || 'Failed to cancel subscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2 text-xs text-green-300">
          <Check size={14} /> {success}
        </div>
      )}

      <div className="rounded-xl border border-[#1E1E2E] bg-[#0c0c14] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown size={16} className={sub?.isActive ? 'text-[#D4A017]' : 'text-gray-500'} />
            <span className="text-sm font-semibold text-white">{sub?.plan || 'Free'} Plan</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sub?.isActive ? 'bg-[#D4A017]/20 text-[#D4A017]' : 'bg-gray-700 text-gray-400'}`}>
            {sub?.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        {sub?.expiryDate && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={12} />
            {sub.isActive ? 'Renews' : 'Expired'}: {new Date(sub.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
        {!sub?.expiryDate && (
          <p className="text-xs text-gray-500">Free plan — no billing information</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider px-1">Select a Plan to Switch</p>
        {[
          { label: 'Free', desc: 'Basic access, limited content', active: sub?.plan === 'Basic' },
          { label: 'Premium', desc: 'Full HD, all content, 2 screens', active: sub?.plan === 'Premium' },
        ].map(p => (
          <button
            key={p.label}
            onClick={() => handlePlanChange(p.label)}
            disabled={loading}
            type="button"
            className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all ${
              p.active 
                ? 'border-[#D4A017]/40 bg-[#D4A017]/5 cursor-default' 
                : 'border-[#1E1E2E] bg-[#0e0e16] hover:border-gray-500 hover:bg-[#151522]'
            }`}
          >
            <div>
              <p className={`text-xs font-semibold ${p.active ? 'text-[#D4A017]' : 'text-gray-300'}`}>{p.label}</p>
              <p className="text-[10px] text-gray-500">{p.desc}</p>
            </div>
            {p.active && <Check size={14} className="text-[#D4A017]" />}
          </button>
        ))}
      </div>

      {sub?.isActive && sub?.plan !== 'Basic' && (
        <button onClick={handleCancel} disabled={loading} className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50">
          {loading ? 'Processing...' : 'Cancel Subscription'}
        </button>
      )}
    </div>
  )
}

function ChangeEmailModal({ profile, onClose, onRefresh }) {
  const [password, setPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await changeEmail(password, newEmail, confirmEmail)
      setSuccess('Email updated successfully!')
      setPassword('')
      setNewEmail('')
      setConfirmEmail('')
      if (onRefresh) onRefresh()
    } catch (err) {
      setError(err.message || 'Failed to change email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2 text-xs text-green-300">
          <Check size={14} /> {success}
        </div>
      )}

      <div>
        <label className="block text-[11px] text-gray-400 mb-1 font-medium">Current Password</label>
        <div className="relative">
          <Lock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-dark pl-8 pr-8 text-xs py-2" placeholder="Enter current password" required />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-[11px] text-gray-400 mb-1 font-medium">New Email</label>
        <div className="relative">
          <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="input-dark pl-8 text-xs py-2" placeholder="new@email.com" required />
        </div>
      </div>
      <div>
        <label className="block text-[11px] text-gray-400 mb-1 font-medium">Confirm New Email</label>
        <div className="relative">
          <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="email" value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} className="input-dark pl-8 text-xs py-2" placeholder="new@email.com" required />
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#D4A017] px-4 py-2.5 text-xs font-semibold text-black transition-all hover:bg-[#b8860b] disabled:opacity-50">
        {loading ? <><Loader size={12} className="animate-spin" /> Updating...</> : 'Update Email'}
      </button>
    </form>
  )
}

function ChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await changePassword(currentPassword, newPassword, confirmPassword)
      setSuccess('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(err.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2 text-xs text-green-300">
          <Check size={14} /> {success}
        </div>
      )}

      <div>
        <label className="block text-[11px] text-gray-400 mb-1 font-medium">Current Password</label>
        <div className="relative">
          <Lock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input-dark pl-8 pr-8 text-xs py-2" placeholder="Enter current password" required />
          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            {showCurrent ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-[11px] text-gray-400 mb-1 font-medium">New Password</label>
        <div className="relative">
          <Lock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-dark pl-8 pr-8 text-xs py-2" placeholder="Min 6 characters" required minLength={6} />
          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            {showNew ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-[11px] text-gray-400 mb-1 font-medium">Confirm New Password</label>
        <div className="relative">
          <Lock size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-dark pl-8 text-xs py-2" placeholder="Re-enter new password" required minLength={6} />
        </div>
      </div>
      <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#D4A017] px-4 py-2.5 text-xs font-semibold text-black transition-all hover:bg-[#b8860b] disabled:opacity-50">
        {loading ? <><Loader size={12} className="animate-spin" /> Updating...</> : 'Update Password'}
      </button>
    </form>
  )
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(user)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null) // 'subscription' | 'email' | 'password' | null

  const refreshProfile = async () => {
    try {
      const data = await getMe()
      setProfile(data?.user ?? data)
    } catch (_) {}
  }

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
    return () => { mounted = false }
  }, [user])

  useEffect(() => {
    if (!settingsOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
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

  const settingsRows = [
    { label: 'Subscription', value: profile?.plan || 'Free', icon: Crown, color: '#D4A017', onClick: () => setActiveModal('subscription') },
    { label: 'Email', value: profile?.email || '-', icon: Mail, color: '#3b82f6', onClick: () => setActiveModal('email') },
    { label: 'Password', value: '••••••••', icon: Lock, color: '#22c55e', onClick: () => setActiveModal('password') },
    { label: 'Parental Controls', value: 'Off', icon: Shield, color: '#a78bfa', onClick: () => setActiveModal('parental') },
  ]

  const modalTitle = activeModal === 'subscription' ? 'Subscription Management' : activeModal === 'email' ? 'Change Email' : activeModal === 'password' ? 'Change Password' : activeModal === 'parental' ? 'Parental Controls' : ''

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
              <button onClick={() => setSettingsOpen(true)} className="glass rounded-xl p-2.5 text-white transition-all hover:bg-white/10" aria-label="Open account settings">
                <Settings size={16} />
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl bg-[#D4A017]/10 px-4 py-2.5 text-sm font-medium text-[#D4A017] transition-all hover:bg-[#D4A017]/20">
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
                  <div key={`${item.showId}-${item.episode}`} onClick={async () => {
                    try { await updateContinueWatching(item.showId, item.episode, item.progress) } catch (_) {}
                    navigate(`/watch/${item.showId}/${item.episode}`)
                  }} className="group flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-white/5">
                    <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#111118]">
                      <div className="flex h-full w-full items-center justify-center bg-white/5"><Play size={16} className="text-gray-500" /></div>
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
              <button onClick={() => setActiveModal('subscription')} className="w-full rounded-lg bg-[#D4A017]/10 px-4 py-2 text-sm text-[#D4A017] transition-colors hover:bg-[#D4A017]/20 sm:w-auto">Manage</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${settingsOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        <button className="absolute inset-0 bg-black/60" onClick={() => { setSettingsOpen(false); setActiveModal(null) }} aria-label="Close settings" />
        <aside className={`glass absolute left-1/2 top-1/2 max-h-[90vh] w-[92%] max-w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-[#1E1E2E] bg-[#09090e] p-4 transition-all duration-300 ${settingsOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          <div className="mb-5 flex items-center justify-between rounded-xl border border-[#1E1E2E] bg-[#0c0c14] p-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={avatarUrl} alt={profile?.name} className="h-10 w-10 rounded-lg border border-[#D4A017]/50" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{profile?.name}</p>
                <p className="truncate text-[11px] text-gray-500">{profile?.email}</p>
              </div>
            </div>
            <button onClick={() => { setSettingsOpen(false); setActiveModal(null) }} className="rounded p-1 text-gray-400 hover:text-white" aria-label="Close panel">
              <X size={16} />
            </button>
          </div>

          <div className="mb-4 flex flex-col items-center rounded-xl border border-[#1E1E2E] bg-black/40 p-4 text-center">
            <img src={avatarUrl} alt={profile?.name} className="mb-2 h-20 w-20 rounded-full border border-[#D4A017]/40 object-cover" />
            <p className="text-xl font-semibold text-[#D4A017]">{profile?.name}</p>
            <p className="text-xs text-gray-500">{profile?.email}</p>
          </div>

          {!activeModal ? (
            <div className="space-y-2">
              {settingsRows.map((row) => (
                <button key={row.label} onClick={row.onClick} className="flex w-full items-center justify-between rounded-md border border-[#2a2a3d] bg-[#0e0e16] px-3 py-2 text-left transition-colors hover:border-[#D4A017]/50">
                  <div className="flex items-center gap-2">
                    <row.icon size={12} style={{ color: row.color }} />
                    <span className="text-xs text-gray-300">{row.label}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    {row.value} <ChevronRight size={12} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <button onClick={() => setActiveModal(null)} className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-white mb-3 transition-colors">
                ← Back to Settings
              </button>
              <h3 className="text-sm font-semibold text-white mb-3">{modalTitle}</h3>
              {activeModal === 'subscription' && <SubscriptionModal profile={profile} onClose={() => setActiveModal(null)} onRefresh={refreshProfile} />}
              {activeModal === 'email' && <ChangeEmailModal profile={profile} onClose={() => setActiveModal(null)} onRefresh={refreshProfile} />}
              {activeModal === 'password' && <ChangePasswordModal onClose={() => setActiveModal(null)} />}
              {activeModal === 'parental' && (
                <div className="text-center py-6">
                  <Shield size={28} className="mx-auto text-[#a78bfa] mb-3" />
                  <p className="text-sm font-semibold text-white mb-1">Parental Controls</p>
                  <p className="text-xs text-gray-500">Coming soon. This feature is under development.</p>
                  <button onClick={() => setActiveModal(null)} className="mt-4 rounded-lg bg-[#D4A017]/10 px-4 py-2 text-xs font-semibold text-[#D4A017] transition-colors hover:bg-[#D4A017]/20">Close</button>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}