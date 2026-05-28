import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login, register, error: authError } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      localStorage.setItem('sv_token', token)
      window.location.href = '/'
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    setSubmitting(true)

    try {
      const result = mode === 'login'
        ? await login(email, password)
        : await register(name, email, password)

      if (!result.ok) {
        setLocalError(result.error || 'Authentication failed')
        return
      }

      navigate('/')
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

      <div className="relative glass rounded-2xl p-8 w-full max-w-md mx-4 fade-up">
        <Link to="/" className="block text-center mb-8">
          <span className="font-display text-3xl text-[#D4A017]">STREAM</span>
          <span className="font-display text-3xl text-white">VAULT</span>
        </Link>

        <div className="flex bg-white/5 rounded-xl p-1 mb-6">
          <button onClick={() => setMode('login')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'login' ? 'bg-[#D4A017] text-white' : 'text-gray-400 hover:text-white'}`}>Sign In</button>
          <button onClick={() => setMode('signup')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'signup' ? 'bg-[#D4A017] text-white' : 'text-gray-400 hover:text-white'}`}>Create Account</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-dark" placeholder="Alex Rivera" required />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email Address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-dark pl-9" placeholder="you@example.com" required />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-dark pl-9 pr-10" placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {(localError || authError) && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg px-3 py-2">
              {localError || authError}
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-shine w-full bg-[#D4A017] hover:bg-[#b8860b] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] mt-2">
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
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
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`}
            className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-medium text-sm transition-all hover:scale-[1.01] active:scale-[0.99] w-full"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.5a5.99 5.99 0 0 1 5.99-6.012c1.49 0 2.852.54 3.906 1.432l3.208-3.208C19.182 2.89 16.792 2 13.99 2 8.196 2 3.5 6.7 3.5 12.5S8.196 23 13.99 23c5.32 0 9.873-3.823 9.873-10.5 0-.71-.08-1.423-.223-2.215H12.24Z"/>
            </svg>
            Continue with Google
          </a>
        </div>
      </div>
    </div>
  )
}
