import { useState } from 'react'
import { Wrench, Lock, Eye, EyeOff, Loader, AlertCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function MaintenanceScreen({ onAdminLogin }) {
  const { login } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      if (!result.ok) {
        setError(result.error || 'Invalid credentials')
        return
      }
      // Check if the logged-in user is actually an admin
      if (result.user?.role !== 'admin') {
        setError('Only administrators can access the site during maintenance.')
        // Clear the stored token — non-admins should not be logged in
        localStorage.removeItem('sv_token')
        return
      }
      // Admin logged in — notify parent to bypass maintenance
      if (onAdminLogin) onAdminLogin()
    } catch (err) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#050508]">
      {/* ── Animated background blobs ── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4A017]/8 blur-[120px] animate-pulse" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-purple-900/10 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-900/8 blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* ── Grid pattern overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      {/* ── Content card ── */}
      <div className="relative z-10 mx-4 flex max-w-lg w-full flex-col items-center text-center">

        {/* Logo */}
        <img
          src="/icons/logo.png"
          alt="BlackShortz"
          className="mb-8 h-14 w-auto object-contain opacity-90"
          onError={(e) => { e.target.style.display = 'none' }}
        />

        {/* Wrench icon with pulse ring */}
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#D4A017]/20 scale-150" />
          <div className="absolute inset-0 animate-ping rounded-full bg-[#D4A017]/10 scale-[2]" style={{ animationDelay: '0.5s' }} />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#D4A017]/30 bg-[#D4A017]/10 shadow-2xl shadow-[#D4A017]/20">
            <Wrench size={40} className="text-[#D4A017]" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="mb-3 font-display text-4xl font-bold tracking-wide text-white sm:text-5xl">
          Under <span className="text-[#D4A017]">Maintenance</span>
        </h1>

        {/* Subtext */}
        <p className="mb-2 text-base text-gray-400 max-w-md leading-relaxed">
          We're working hard to improve your experience. The site will be back online shortly.
        </p>
        <p className="mb-10 text-sm text-gray-600">
          Thank you for your patience 🙏
        </p>

        {/* Status dots */}
        <div className="mb-10 flex items-center gap-3">
          {[0, 0.3, 0.6].map((delay, i) => (
            <div
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-[#D4A017] animate-bounce"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>

        {/* Admin login section */}
        {!showLogin ? (
          <button
            onClick={() => setShowLogin(true)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-gray-400 transition-all hover:border-[#D4A017]/30 hover:bg-white/8 hover:text-white"
          >
            <Lock size={14} />
            Admin Login
          </button>
        ) : (
          <div className="w-full rounded-2xl border border-[#1E1E2E] bg-[#0c0c14] p-6 text-left shadow-2xl">
            <div className="mb-5 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#D4A017]" />
              <h3 className="text-sm font-semibold text-white">Administrator Access</h3>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  <AlertCircle size={13} /> {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-dark text-sm"
                  placeholder="admin@example.com"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-dark input-dark--icon-right text-sm"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-auth-submit flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm"
                >
                  {loading ? <><Loader size={13} className="animate-spin" /> Verifying...</> : 'Sign In as Admin'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowLogin(false); setError(''); setEmail(''); setPassword('') }}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs text-gray-500 transition-colors hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
