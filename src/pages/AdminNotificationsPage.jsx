import { useState, useEffect } from 'react'
import { Send, Bell, BarChart2, Users, UserCheck, Shield, AlertCircle, CheckCircle } from 'lucide-react'
import { adminSendNotification, adminGetNotificationStats } from '../api/client'

export default function AdminNotificationsPage() {
  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'announcement',
    targetAudience: 'all',
    specificUserId: '',
    actionUrl: '',
    priority: 'normal'
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const res = await adminGetNotificationStats()
      if (res?.data) setStats(res.data)
    } catch (_) {}
    setStatsLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) return
    setSending(true)
    setResult(null)
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        targetAudience: form.targetAudience,
        priority: form.priority
      }
      if (form.actionUrl.trim()) payload.actionUrl = form.actionUrl.trim()
      if (form.targetAudience === 'specificUser' && form.specificUserId.trim()) {
        payload.specificUserId = form.specificUserId.trim()
      }
      const res = await adminSendNotification(payload)
      setResult({ success: true, message: res?.message || 'Notification sent successfully!' })
      setForm({ title: '', message: '', type: 'announcement', targetAudience: 'all', specificUserId: '', actionUrl: '', priority: 'normal' })
      fetchStats()
    } catch (err) {
      setResult({ success: false, message: err?.message || 'Failed to send notification' })
    }
    setSending(false)
  }

  const targetOptions = [
    { value: 'all', label: 'All Users', icon: Users, desc: 'Every registered user' },
    { value: 'premium', label: 'Premium Users', icon: UserCheck, desc: 'Active premium subscribers' },
    { value: 'free', label: 'Free Users', icon: Users, desc: 'Free tier users' },
    { value: 'admin', label: 'Admins Only', icon: Shield, desc: 'All admin accounts' },
    { value: 'specificUser', label: 'Specific User', icon: AlertCircle, desc: 'Send to a single user' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell size={24} className="text-[var(--accent)]" />
          Send Notifications
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Create and send custom notifications to users.</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Sent', value: stats.totalSent, color: 'text-[var(--accent)]' },
            { label: 'Unread', value: stats.totalUnread, color: 'text-orange-400' },
            { label: 'Read Rate', value: `${stats.readRate}%`, color: 'text-green-400' },
            { label: 'Today', value: stats.sentToday, color: 'text-blue-400' },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
              <p className="text-xs text-[var(--text-muted)]">{card.label}</p>
              <p className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Creator Form */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Compose Notification</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Title *</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Notification title..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-white placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                maxLength={200}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Message *</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Notification message..."
                rows={4}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-white placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none resize-none"
                maxLength={1000}
                required
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{form.message.length}/1000</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="announcement">Announcement</option>
                  <option value="admin">Admin</option>
                  <option value="content">Content</option>
                  <option value="system">System</option>
                  <option value="account">Account</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-white focus:border-[var(--accent)] focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Action URL (optional)</label>
              <input
                value={form.actionUrl}
                onChange={(e) => setForm({ ...form, actionUrl: e.target.value })}
                placeholder="/subscription, /series/..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-white placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>

            {result && (
              <div className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                result.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {result.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {result.message}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !form.title.trim() || !form.message.trim()}
              className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>

        {/* Target Audience */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Target Audience</h2>
          <div className="space-y-2">
            {targetOptions.map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setForm({ ...form, targetAudience: opt.value })}
                  className={`w-full text-left rounded-lg border p-3 transition-all ${
                    form.targetAudience === opt.value
                      ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                      : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={16} className={form.targetAudience === opt.value ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
                    <span className={`text-sm font-medium ${form.targetAudience === opt.value ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1 ml-6">{opt.desc}</p>
                </button>
              )
            })}
          </div>

          {form.targetAudience === 'specificUser' && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">User ID</label>
              <input
                value={form.specificUserId}
                onChange={(e) => setForm({ ...form, specificUserId: e.target.value })}
                placeholder="Enter user MongoDB ID..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-sm text-white placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}