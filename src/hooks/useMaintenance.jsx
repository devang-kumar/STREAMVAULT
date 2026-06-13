import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { getStatus } from '../api/client'
import { useAuth } from './useAuth'

const MaintenanceContext = createContext({ maintenanceMode: false, isAdminBypass: false, setAdminBypass: () => {} })

const POLL_INTERVAL = 5_000 // re-check every 5s

export function MaintenanceProvider({ children }) {
  const { user } = useAuth()
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [loading, setLoading] = useState(true)
  // Once an admin logs in during maintenance, we allow them through
  const [isAdminBypass, setIsAdminBypass] = useState(false)

  // When user logs out or is no longer an admin, clear bypass
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setIsAdminBypass(false)
    }
  }, [user])

  const checkStatus = useCallback(async () => {
    try {
      const data = await getStatus()
      setMaintenanceMode(data?.maintenanceMode ?? false)
    } catch (_) {
      // If API is unreachable, don't block the site
      setMaintenanceMode(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkStatus()
    const timer = setInterval(checkStatus, POLL_INTERVAL)
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [checkStatus])

  // When maintenance mode turns off (admin disabled it), clear bypass
  useEffect(() => {
    if (!maintenanceMode) setIsAdminBypass(false)
  }, [maintenanceMode])

  return (
    <MaintenanceContext.Provider value={{ maintenanceMode, isAdminBypass, setAdminBypass: setIsAdminBypass, loading }}>
      {children}
    </MaintenanceContext.Provider>
  )
}

export function useMaintenance() {
  return useContext(MaintenanceContext)
}
