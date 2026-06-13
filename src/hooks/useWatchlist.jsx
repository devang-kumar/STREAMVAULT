import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../api/client'
import { useAuth } from './useAuth'

const WatchlistContext = createContext(null)

export function WatchlistProvider({ children }) {
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchWatchlist = useCallback(async () => {
    if (!user) {
      setWatchlist([])
      setLoading(false)
      return
    }
    try {
      const res = await getWatchlist()
      if (res?.watchlist) {
        setWatchlist(res.watchlist)
      }
    } catch (err) {
      console.error('Failed to fetch watchlist:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist])

  const isWatchlisted = useCallback((showId) => {
    return watchlist.some((item) => {
      // item might be an object (populated) or just an ID string
      const id = typeof item === 'object' && item !== null ? item._id || item.id : item
      return String(id) === String(showId)
    })
  }, [watchlist])

  const add = async (showId, contentType = 'series') => {
    try {
      await addToWatchlist(showId, contentType)
      fetchWatchlist()
      return true
    } catch (err) {
      console.error('Failed to add to watchlist:', err)
      return false
    }
  }

  const remove = async (showId, contentType = 'series') => {
    try {
      // Optimistic update
      setWatchlist(prev => prev.filter(item => {
        const id = typeof item === 'object' && item !== null ? item._id || item.id : item
        return String(id) !== String(showId)
      }))
      await removeFromWatchlist(showId, contentType)
      return true
    } catch (err) {
      console.error('Failed to remove from watchlist:', err)
      fetchWatchlist() // revert
      return false
    }
  }

  const toggleWatchlist = async (showId, contentType = 'series') => {
    if (isWatchlisted(showId)) {
      return await remove(showId, contentType)
    } else {
      return await add(showId, contentType)
    }
  }

  return (
    <WatchlistContext.Provider value={{ watchlist, loading, isWatchlisted, toggleWatchlist, add, remove, fetchWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlist() {
  const context = useContext(WatchlistContext)
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider')
  }
  return context
}
