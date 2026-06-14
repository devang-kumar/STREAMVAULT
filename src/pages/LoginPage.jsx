import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { API_BASE } from '../api/client'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [localError, setLocalError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, register, verifyOtp, error: authError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('sv_token', token)
      window.location.href = '/'
      return
    }
    const modeParam = params.get('mode')
    if (modeParam === 'signup') {
      setMode('signup')
    } else if (modeParam === 'signin' || modeParam === 'login') {
      setMode('login')
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    setSubmitting(true)

    try {
      if (mode === 'otp') {
        const result = await verifyOtp(email, otp)
        if (!result.ok) {
          setLocalError(result.error || 'Verification failed')
          return
        }
        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      } else {
        const result = mode === 'login'
          ? await login(email, password)
          : await register(name, email, password)

        if (!result.ok) {
          setLocalError(result.error || 'Authentication failed')
          return
        }

        if (mode === 'login' && result.requiresOtp) {
          setMode('otp')
          return
        }

        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0A0A0F]">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4A017]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative glass rounded-2xl px-8 py-12 w-full max-w-lg mx-4 fade-up">
        <Link to="/" className="block text-center mb-5">
          <img
            src="/icons/logo.png"
            alt="Black Shortz"
            className="h-14 w-auto object-contain mx-auto"
          />
        </Link>

        {mode !== 'otp' && (
          <div className="flex bg-white/5 rounded-xl p-1 mb-4">
            <button onClick={() => setMode('login')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'login' ? 'btn-auth-submit' : 'text-gray-400 hover:text-white'}`}>Sign In</button>
            <button onClick={() => setMode('signup')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'signup' ? 'btn-auth-submit' : 'text-gray-400 hover:text-white'}`}>Create Account</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'otp' ? (
            <div>
              <p className="text-sm text-gray-400 mb-3 text-center">
                Enter the 6-digit verification code below.
              </p>
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-4">
                <span className="text-amber-400 text-base leading-none mt-0.5">⚠️</span>
                <p className="text-amber-300 text-xs leading-relaxed">
                  <strong>Note:</strong> Email delivery is currently blocked by Google security. Use the hardcoded OTP: <strong className="text-amber-200 tracking-widest">123456</strong>
                </p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Verification Code</label>
                <div className="relative">
                  <Lock size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-500" />
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} className="input-dark input-dark--icon-left text-center tracking-widest text-lg" placeholder="123456" maxLength={6} required />
                </div>
              </div>
            </div>
          ) : (
            <>
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-dark" placeholder="Alex Rivera" required />
                </div>
              )}

              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-dark input-dark--icon-left" placeholder="you@example.com" required />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
                <div className="relative">
                  <Lock size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-500" />
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-dark input-dark--icon-left input-dark--icon-right" placeholder="••••••••" required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-gray-500 hover:text-white">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              {mode === 'login' && (
                <div className="flex justify-end -mt-1">
                  <RouterLink to="/forgot-password" className="text-xs text-[#D4A017] hover:text-[#e8b41c] transition-colors font-medium">
                    Forgot Password?
                  </RouterLink>
                </div>
              )}
            </>
          )}

          {(localError || authError) && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg px-3 py-2">
              {localError || authError}
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-auth-submit w-full py-3 rounded-xl mt-2">
            {submitting ? 'Please wait...' : mode === 'otp' ? 'Verify Code' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {mode !== 'otp' && (
          <>
            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0A0A0F] px-2 text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>

            {/* OAuth Buttons */}
            <div className="space-y-3">
              <a
                href={`${API_BASE}/auth/google`}
                className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-medium text-sm transition-all hover:scale-[1.01] active:scale-[0.99] w-full"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.5a5.99 5.99 0 0 1 5.99-6.012c1.49 0 2.852.54 3.906 1.432l3.208-3.208C19.182 2.89 16.792 2 13.99 2 8.196 2 3.5 6.7 3.5 12.5S8.196 23 13.99 23c5.32 0 9.873-3.823 9.873-10.5 0-.71-.08-1.423-.223-2.215H12.24Z"/>
                </svg>
                Continue with Google
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
