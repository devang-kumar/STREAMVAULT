import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck, Trash2, Search, Filter, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getNotificationHistory, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications } from '../api/client'

export default function NotificationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [grouped, setGrouped] = useState({ today: [], yesterday: [], earlier: [] })
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const fetchNotifications = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = { page, limit: 30 }
      if (search) params.search = search
      if (typeFilter) params.type = typeFilter
      const res = await getNotificationHistory(params)
      if (res?.data) setGrouped(res.data)
      if (res?.pagination) setPagination(res.pagination)
    } catch (_) {}
    setLoading(false)
  }, [search, typeFilter])

  useEffect(() => {
    fetchNotifications(1)
  }, [fetchNotifications])

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id)
      setGrouped(prev => {
        const update = (list) => list.map(n => n._id === id ? { ...n, isRead: true } : n)
        return { today: update(prev.today), yesterday: update(prev.yesterday), earlier: update(prev.earlier) }
      })
    } catch (_) {}
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setGrouped(prev => {
        const update = (list) => list.map(n => ({ ...n, isRead: true }))
        return { today: update(prev.today), yesterday: update(prev.yesterday), earlier: update(prev.earlier) }
      })
    } catch (_) {}
  }

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id)
      setGrouped(prev => {
        const update = (list) => list.filter(n => n._id !== id)
        return { today: update(prev.today), yesterday: update(prev.yesterday), earlier: update(prev.earlier) }
      })
    } catch (_) {}
  }

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications?')) return
    try {
      await clearAllNotifications()
      setGrouped({ today: [], yesterday: [], earlier: [] })
    } catch (_) {}
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  const typeColors = {
    content: 'text-blue-400',
    subscription: 'text-green-400',
    payment: 'text-yellow-400',
    security: 'text-red-400',
    admin: 'text-purple-400',
    announcement: 'text-orange-400',
    system: 'text-gray-400',
    account: 'text-cyan-400'
  }

  const renderNotification = (n) => (
    <div
      key={n._id}
      className={`group relative rounded-xl border p-4 transition-all ${
        !n.isRead
          ? 'border-[#D4A017]/30 bg-[#D4A017]/5 hover:bg-[#D4A017]/10'
          : 'border-[#1E1E2E] bg-[#0D0D14] hover:border-[#2a2a3d] hover:bg-[#12121a]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {!n.isRead && <span className="h-2 w-2 rounded-full bg-[#D4A017] flex-shrink-0" />}
            <h3 className="text-sm font-semibold text-white truncate">{n.title}</h3>
            {n.priority === 'high' && (
              <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium text-red-400">High</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-2">{n.message}</p>
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className={`capitalize ${typeColors[n.type] || 'text-gray-500'}`}>{n.type}</span>
            <span>{formatTime(n.createdAt)}</span>
            {n.actionUrl && (
              <button
                onClick={() => navigate(n.actionUrl)}
                className="text-[#D4A017] hover:underline"
              >
                View →
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {!n.isRead && (
            <button
              onClick={() => handleMarkRead(n._id)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-green-400"
              title="Mark as read"
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={() => handleDelete(n._id)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-red-400"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )

  const renderSection = (title, items) => {
    if (items.length === 0) return null
    return (
      <div className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">{title}</h2>
        <div className="space-y-2">
          {items.map(renderNotification)}
        </div>
      </div>
    )
  }

  const totalItems = grouped.today.length + grouped.yesterday.length + grouped.earlier.length

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-20 pb-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Bell size={24} className="text-[#D4A017]" />
              Notifications
            </h1>
            <p className="text-sm text-gray-400 mt-1">{pagination.total} notification{pagination.total !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 rounded-lg border border-[#1E1E2E] px-3 py-2 text-xs text-gray-300 transition-colors hover:border-[#D4A017]/50 hover:text-[#D4A017]"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 rounded-lg border border-[#1E1E2E] px-3 py-2 text-xs text-gray-300 transition-colors hover:border-red-500/50 hover:text-red-400"
            >
              <Trash2 size={14} /> Clear all
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-lg border border-[#1E1E2E] bg-[#0D0D14] pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#D4A017]/50 focus:outline-none"
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(''); setSearch('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={14} />
              </button>
            )}
          </form>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-[#1E1E2E] bg-[#0D0D14] pl-9 pr-8 py-2.5 text-sm text-white appearance-none focus:border-[#D4A017]/50 focus:outline-none cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="content">Content</option>
              <option value="subscription">Subscription</option>
              <option value="payment">Payment</option>
              <option value="security">Security</option>
              <option value="admin">Admin</option>
              <option value="announcement">Announcements</option>
              <option value="system">System</option>
              <option value="account">Account</option>
            </select>
          </div>
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4A017] border-t-transparent" />
          </div>
        ) : totalItems === 0 ? (
          <div className="text-center py-20">
            <Bell size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No notifications found.</p>
            <p className="text-sm text-gray-600 mt-1">
              {search || typeFilter ? 'Try adjusting your filters.' : 'You\'re all caught up!'}
            </p>
          </div>
        ) : (
          <>
            {renderSection('Today', grouped.today)}
            {renderSection('Yesterday', grouped.yesterday)}
            {renderSection('Earlier', grouped.earlier)}
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => fetchNotifications(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 rounded-lg border border-[#1E1E2E] px-3 py-2 text-xs text-gray-300 transition-colors hover:border-[#D4A017]/50 hover:text-[#D4A017] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchNotifications(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-1 rounded-lg border border-[#1E1E2E] px-3 py-2 text-xs text-gray-300 transition-colors hover:border-[#D4A017]/50 hover:text-[#D4A017] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Back button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-[#D4A017] transition-colors"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  )
}