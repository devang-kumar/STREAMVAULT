import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, Bell, ChevronDown, User, LogOut, Shield, Menu, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { OTT_CATEGORIES } from '../data/categories'
import { getShows } from '../api/client'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState([])
  const [seenNotificationIds, setSeenNotificationIds] = useState([])
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const categoriesRef = useRef(null)
  const profileRef = useRef(null)
  const searchRef = useRef(null)
  const notificationsRef = useRef(null)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target)) setShowCategories(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false)
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setShowNotifications(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setSeenNotificationIds([])
      return
    }

    const seenKey = `sv_seen_notifications_${user.email || user.id || 'user'}`
    const savedSeen = JSON.parse(localStorage.getItem(seenKey) || '[]')
    setSeenNotificationIds(Array.isArray(savedSeen) ? savedSeen : [])

    ;(async () => {
      const userItems = []
      const adminItems = []

      const continueList = Array.isArray(user.continueWatching) ? user.continueWatching : []
      if (continueList.length > 0) {
        const next = continueList[0]
        userItems.push({
          id: `continue-${next.showId}-${next.episode}`,
          title: 'Continue watching',
          body: `Episode ${next.episode} is waiting (${next.progress || 0}% complete).`,
          cta: `/watch/${next.showId}/${next.episode}`,
          channel: 'user',
        })
      }

      if (user.plan && user.plan.toLowerCase() === 'free') {
        userItems.push({
          id: 'plan-upgrade',
          title: 'Upgrade available',
          body: 'Unlock premium episodes and ad-free streaming.',
          cta: '/subscription',
          channel: 'user',
        })
      }

      if (user.role === 'admin') {
        adminItems.push({
          id: 'admin-review',
          title: 'Admin quick action',
          body: 'Review the latest content updates from dashboard.',
          cta: '/admin',
          channel: 'admin',
        })
      }

      try {
        const shows = await getShows()
        const newShows = (Array.isArray(shows) ? shows : []).filter((s) => s.tag === 'New').slice(0, 2)
        newShows.forEach((s) => {
          userItems.push({
            id: `new-${s.id}`,
            title: 'New release',
            body: `${s.title} just landed in the library.`,
            cta: `/series/${s.id}`,
            channel: 'user',
          })
        })
      } catch (_err) {
        // ignore notification enrichment failure
      }

      setNotifications([...userItems, ...adminItems])
    })()
  }, [user])

  const seenKey = user ? `sv_seen_notifications_${user.email || user.id || 'user'}` : ''
  const unreadCount = notifications.filter((n) => !seenNotificationIds.includes(n.id)).length
  const userNotifications = notifications.filter((n) => n.channel !== 'admin')
  const adminNotifications = notifications.filter((n) => n.channel === 'admin')

  const getUnreadCount = (list) => list.filter((n) => !seenNotificationIds.includes(n.id)).length

  const markAllNotificationsRead = () => {
    const ids = notifications.map((n) => n.id)
    setSeenNotificationIds(ids)
    if (seenKey) localStorage.setItem(seenKey, JSON.stringify(ids))
  }

  const handleNotificationClick = (notification) => {
    const nextSeen = Array.from(new Set([...seenNotificationIds, notification.id]))
    setSeenNotificationIds(nextSeen)
    if (seenKey) localStorage.setItem(seenKey, JSON.stringify(nextSeen))
    setShowNotifications(false)
    if (notification.cta) navigate(notification.cta)
  }

  const handleLogout = () => {
    logout()
    setShowProfile(false)
    navigate('/')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
    setShowSearch(false)
    setMobileMenuOpen(false)
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-[#1E1E2E] bg-[#0A0A0F]/95 backdrop-blur-sm' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg border border-[#1E1E2E] p-2 text-gray-300 transition-colors hover:text-white md:hidden"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl tracking-wider text-[#D4A017] sm:text-3xl">STREAM</span>
            <span className="font-display text-2xl tracking-wider text-white sm:text-3xl">VAULT</span>
          </Link>
        </div>

        <div className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link to="/" className={`transition-colors hover:text-white ${isActive('/') ? 'text-white' : 'text-gray-400'}`}>
            Home
          </Link>

          <div className="relative" ref={categoriesRef}>
            <button
              onMouseEnter={() => setShowCategories(true)}
              onFocus={() => setShowCategories(true)}
              className="flex items-center gap-1 text-gray-400 transition-colors hover:text-white"
            >
              Categories <ChevronDown size={14} className={`transition-transform ${showCategories ? 'rotate-180' : ''}`} />
            </button>
            {showCategories && (
              <div
                onMouseEnter={() => setShowCategories(true)}
                onMouseLeave={() => setShowCategories(false)}
                className="glass absolute left-0 top-8 grid w-56 grid-cols-2 gap-1 rounded-xl p-3"
              >
                {OTT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setShowCategories(false)
                      navigate(`/search?q=${encodeURIComponent(cat)}`)
                    }}
                    className="rounded-lg px-2 py-1.5 text-left text-xs text-gray-400 transition-colors hover:bg-white/5 hover:text-[#D4A017]"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link to="/subscription" className="text-gray-400 transition-colors hover:text-white">
            Plans
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative" ref={searchRef}>
            <button onClick={() => setShowSearch((p) => !p)} className="text-gray-400 transition-colors hover:text-white">
              <Search size={18} />
            </button>
            {showSearch && (
              <div className="glass absolute right-0 top-10 w-72 rounded-xl p-2 sm:w-80">
                <form onSubmit={handleSearchSubmit}>
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles or genres..."
                    className="input-dark py-2 text-xs"
                  />
                </form>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {OTT_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        navigate(`/search?q=${encodeURIComponent(cat)}`)
                        setShowSearch(false)
                      }}
                      className="rounded-full border border-[#2a2a3d] px-2 py-0.5 text-[11px] text-gray-300 transition-colors hover:border-[#D4A017]/60 hover:text-[#D4A017]"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {user && (
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications((p) => !p)}
                className="relative text-gray-400 transition-colors hover:text-white"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4A017] px-1 text-[9px] font-bold text-black">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="glass absolute right-0 top-10 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl p-2">
                  <div className="mb-2 flex items-center justify-between px-2 py-1">
                    <p className="text-xs font-semibold text-white">Notifications</p>
                    {notifications.length > 0 && (
                      <button onClick={markAllNotificationsRead} className="text-[11px] text-[#D4A017] hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-gray-500">No notifications right now.</p>
                  ) : (
                    <div className="max-h-80 space-y-3 overflow-y-auto px-1 pb-1">
                      {userNotifications.length > 0 && (
                        <div>
                          <div className="mb-1 flex items-center justify-between px-2">
                            <p className="text-[11px] uppercase tracking-wider text-gray-500">User Notifications</p>
                            <span className="text-[10px] text-gray-500">{getUnreadCount(userNotifications)} unread</span>
                          </div>
                          <div className="space-y-1">
                            {userNotifications.map((n) => {
                              const unread = !seenNotificationIds.includes(n.id)
                              return (
                                <button
                                  key={n.id}
                                  onClick={() => handleNotificationClick(n)}
                                  className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                                    unread ? 'bg-[#D4A017]/10 hover:bg-[#D4A017]/15' : 'hover:bg-white/5'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs font-medium text-white">{n.title}</p>
                                    {unread && <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#D4A017]" />}
                                  </div>
                                  <p className="mt-0.5 text-[11px] text-gray-400">{n.body}</p>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {user?.role === 'admin' && (
                        <div>
                          <div className="mb-1 flex items-center justify-between px-2">
                            <p className="text-[11px] uppercase tracking-wider text-gray-500">Admin Notifications</p>
                            <span className="text-[10px] text-gray-500">{getUnreadCount(adminNotifications)} unread</span>
                          </div>
                          {adminNotifications.length === 0 ? (
                            <p className="px-2 py-1 text-[11px] text-gray-600">No admin alerts.</p>
                          ) : (
                            <div className="space-y-1">
                              {adminNotifications.map((n) => {
                                const unread = !seenNotificationIds.includes(n.id)
                                return (
                                  <button
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                                      unread ? 'bg-blue-500/10 hover:bg-blue-500/15' : 'hover:bg-white/5'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-xs font-medium text-white">{n.title}</p>
                                      {unread && <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-400" />}
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-gray-400">{n.body}</p>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="relative" ref={profileRef}>
              <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full border border-[#1E1E2E] object-cover" />
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${showProfile ? 'rotate-180' : ''}`} />
              </button>
              {showProfile && (
                <div className="glass absolute right-0 top-10 w-56 rounded-xl p-1">
                  <div className="mb-1 border-b border-white/10 px-3 py-2">
                    <p className="text-sm font-semibold">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="badge-premium inline-block">{user.plan}</span>
                      {isAdmin && <span className="rounded bg-[#D4A017]/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#D4A017]">ADMIN</span>}
                    </div>
                  </div>
                  <Link to="/profile" onClick={() => setShowProfile(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white">
                    <User size={14} /> Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowProfile(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#D4A017] transition-colors hover:bg-[#D4A017]/10 hover:text-[#f1c24f]"
                    >
                      <Shield size={14} /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="px-3 py-1.5 text-sm text-gray-300 transition-colors hover:text-white">
                Sign In
              </Link>
              <Link to="/login" className="rounded-lg bg-[#D4A017] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#b8860b]">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      {mobileMenuOpen && <button onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" aria-label="Close menu overlay" />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[84%] max-w-xs border-r border-[#1E1E2E] bg-[#0D0D14] p-5 transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Browse</p>
          <button onClick={() => setMobileMenuOpen(false)} className="rounded-md p-1 text-gray-400 hover:text-white" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSearchSubmit} className="mb-5">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search content..." className="input-dark text-xs" />
        </form>
        <div className="space-y-1">
          <Link to="/" className="block rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">Home</Link>
          <Link to="/subscription" className="block rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">Plans</Link>
          <Link to="/search" className="block rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">Search</Link>
          {user && <Link to="/profile" className="block rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white">Profile</Link>}
        </div>
        <div className="mt-6 border-t border-[#1E1E2E] pt-4">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-gray-500">Categories</p>
          <div className="flex flex-wrap gap-2">
            {OTT_CATEGORIES.slice(0, 8).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(cat)}`)
                  setMobileMenuOpen(false)
                }}
                className="rounded-full border border-[#2a2a3d] px-2.5 py-1 text-[11px] text-gray-300 transition-colors hover:border-[#D4A017]/60 hover:text-[#D4A017]"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </nav>
  )
}
