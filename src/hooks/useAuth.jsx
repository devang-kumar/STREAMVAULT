import { createContext, useContext, useEffect, useState } from 'react'
import { getMe, login as loginApi, register as registerApi } from '../api/client'

const AuthContext = createContext(null)

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
      localStorage.setItem('sv_token', res.token)
      setUser(res.user)
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
      return { ok: true, user: res.user }
    } catch (err) {
      const message = err?.message || 'Registration failed'
      setError(message)
      return { ok: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('sv_token')
    setUser(null)
    setError('')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
