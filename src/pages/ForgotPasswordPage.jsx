import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { forgotPassword, resetPasswordWithOtp } from '../api/client'

export default function ForgotPasswordPage() {
  const [mode, setMode] = useState('email') // 'email', 'otp', 'success'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await forgotPassword(email)
      setMode('otp')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await resetPasswordWithOtp(email, otp, password)
      setMode('success')
    } catch (err) {
      setError(err.message || 'Failed to reset password.')
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
          <img
            src="/icons/logo.png"
            alt="StreamVault"
            className="h-10 w-auto object-contain mx-auto"
          />
        </Link>

        {mode === 'success' ? (
          /* ── Success state ── */
          <div className="text-center space-y-4">
            <CheckCircle size={48} className="text-green-400 mx-auto" />
            <h2 className="text-xl font-bold text-white">Password Reset!</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your password has been successfully updated. You can now use your new password to sign in.
            </p>
            <div className="pt-4 space-y-3">
              <Link
                to="/login"
                className="btn-auth-submit w-full py-3 rounded-xl flex items-center justify-center transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        ) : mode === 'otp' ? (
          /* ── OTP & New Password form ── */
          <>
            <button
              type="button"
              onClick={() => setMode('email')}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={14} />
              Back
            </button>

            <h2 className="text-xl font-bold text-white mb-2">Create New Password</h2>
            <p className="text-gray-400 text-sm mb-3">
              Enter the 6-digit verification code along with your new password.
            </p>
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 mb-4">
              <span className="text-amber-400 text-base leading-none mt-0.5">⚠️</span>
              <p className="text-amber-300 text-xs leading-relaxed">
                <strong>Note:</strong> Email delivery is currently blocked by Google security. Use the hardcoded OTP: <strong className="text-amber-200 tracking-widest">123456</strong>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Verification Code</label>
                <div className="relative">
                  <Lock size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="input-dark input-dark--icon-left tracking-widest text-lg"
                    placeholder="------"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">New Password</label>
                <div className="relative">
                  <Lock size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-dark input-dark--icon-left input-dark--icon-right"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-gray-500 hover:text-white">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Confirm Password</label>
                <div className="relative">
                  <Lock size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-dark input-dark--icon-left input-dark--icon-right"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-gray-500 hover:text-white">
                    {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-auth-submit w-full py-3 rounded-xl mt-2"
              >
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        ) : (
          /* ── Email form ── */
          <>
            <Link
              to="/login"
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={14} />
              Back to Sign In
            </Link>

            <h2 className="text-xl font-bold text-white mb-2">Forgot Password?</h2>
            <p className="text-gray-400 text-sm mb-6">
              Enter the email address associated with your account and we'll send
              you a 6-digit code to reset your password.
            </p>

            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email Address</label>
                <div className="relative">
                  <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-dark input-dark--icon-left"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-auth-submit w-full py-3 rounded-xl mt-2"
              >
                {submitting ? 'Sending...' : 'Send Code'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}