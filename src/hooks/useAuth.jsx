import { createContext, useContext, useEffect, useState } from 'react'
import { getMe, login as loginApi, register as registerApi, verifyOtp as verifyOtpApi, trackActivity } from '../api/client'

const defaultAuth = {
  user: null,
  isLoading: true,
  error: '',
  login: async () => ({ ok: false, error: 'Auth not ready' }),
  register: async () => ({ ok: false, error: 'Auth not ready' }),
  verifyOtp: async () => ({ ok: false, error: 'Auth not ready' }),
  logout: () => {},
}

const AuthContext = createContext(defaultAuth)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('sv_token')
    if (!token) {
      setIsLoading(false)
      return
    }

    getMe()
      .then((res) => {
        const resolvedUser = res?.user ?? res
        setUser(resolvedUser || null)
        setError('')
      })
      .catch((err) => {
        const status = err?.status
        if (status === 401) {
          localStorage.removeItem('sv_token')
        }
        setUser(null)
        setError(err?.message || 'Failed to restore session')
      })
      .finally(() => setIsLoading(false))
  }, [])

  const login = async (email, password) => {
    try {
      setError('')
      const res = await loginApi(email, password)
      if (res.requiresOtp) {
        return { ok: true, requiresOtp: true, email: res.email }
      }
      localStorage.setItem('sv_token', res.token)
      setUser(res.user)
      trackActivity('login', { email }).catch(() => {})
      return { ok: true, user: res.user }
    } catch (err) {
      const message = err?.message || 'Login failed'
      setError(message)
      return { ok: false, error: message }
    }
  }

  const register = async (name, email, password) => {
    try {
      setError('')
      const res = await registerApi(name, email, password)
      localStorage.setItem('sv_token', res.token)
      setUser(res.user)
      trackActivity('register', { email }).catch(() => {})
      return { ok: true, user: res.user }
    } catch (err) {
      const message = err?.message || 'Registration failed'
      setError(message)
      return { ok: false, error: message }
    }
  }

  const verifyOtp = async (email, otp) => {
    try {
      setError('')
      const res = await verifyOtpApi(email, otp)
      localStorage.setItem('sv_token', res.token)
      setUser(res.user)
      return { ok: true, user: res.user }
    } catch (err) {
      const message = err?.message || 'OTP verification failed'
      setError(message)
      return { ok: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('sv_token')
    setUser(null)
    setError('')
  }

  const refreshUser = async () => {
    try {
      const res = await getMe()
      const resolvedUser = res?.user ?? res
      setUser(resolvedUser || null)
      return { ok: true, user: resolvedUser }
    } catch (err) {
      return { ok: false, error: err?.message || 'Failed to refresh session' }
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, verifyOtp, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  return ctx ?? defaultAuth
}
